import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { sendDailyReport } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get total tasks
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Get completed today
    const { count: completedToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', today);

    // Get in progress
    const { count: inProgress } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // Get overdue tasks
    const { count: overdue } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed');

    // Get top performers (staff with most completed tasks today)
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('assigned_staff_ids')
      .eq('status', 'completed')
      .gte('updated_at', today);

    // Count tasks per staff member
    const staffTaskCounts: Record<string, number> = {};
    completedTasks?.forEach(task => {
      task.assigned_staff_ids?.forEach((staffId: string) => {
        staffTaskCounts[staffId] = (staffTaskCounts[staffId] || 0) + 1;
      });
    });

    // Get top 5 performers
    const topStaffIds = Object.entries(staffTaskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([staffId]) => staffId);

    const topPerformers = [];
    if (topStaffIds.length > 0) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name')
        .in('id', topStaffIds);

      for (const staff of staffData || []) {
        topPerformers.push({
          staffName: staff.name,
          tasksCompleted: staffTaskCounts[staff.id] || 0,
        });
      }
    }

    // Get team performance
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name');

    const teamPerformance = [];
    for (const team of teams || []) {
      const { count: teamTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .contains('assigned_team_ids', [team.id]);

      const { count: teamCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .contains('assigned_team_ids', [team.id])
        .eq('status', 'completed');

      const completionRate = teamTasks ? Math.round(((teamCompleted || 0) / teamTasks) * 100) : 0;

      teamPerformance.push({
        teamName: team.name,
        completionRate,
      });
    }

    // Get admin email
    const { data: admin } = await supabase
      .from('admins')
      .select('email')
      .limit(1)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    // Send report
    await sendDailyReport(admin.email, {
      totalTasks: totalTasks || 0,
      completedToday: completedToday || 0,
      inProgress: inProgress || 0,
      overdue: overdue || 0,
      teamPerformance: teamPerformance.slice(0, 5),
      topPerformers,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Daily report sent successfully' 
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

