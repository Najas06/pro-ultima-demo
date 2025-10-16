import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { 
  sendTaskAssignmentEmail, 
  sendTaskUpdateEmail, 
  sendTaskDelegationEmail,
  sendDelegationAdminNotification,
  sendTaskRejectionEmail,
  sendTaskApprovalEmail,
  sendTeamTaskAssignmentEmail,
  sendTaskStatusChangeEmail
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { 
      taskId, 
      staffId, 
      staffEmail, 
      staffName, 
      type, 
      delegatedBy, 
      adminEmail, 
      changes,
      rejectedBy,
      approvedBy,
      // New parameters for team and status notifications
      teamName,
      leaderEmail,
      leaderName,
      teamMemberCount,
      oldStatus,
      newStatus
    } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Handle different email types
    switch (type) {
      case 'assignment':
        if (!staffEmail || !staffName) {
          return NextResponse.json(
            { error: 'Missing staff email or name for assignment' },
            { status: 400 }
          );
        }
        await sendTaskAssignmentEmail(task, staffEmail, staffName);
        break;

      case 'update':
        if (!staffEmail || !staffName) {
          return NextResponse.json(
            { error: 'Missing staff email or name for update' },
            { status: 400 }
          );
        }
        await sendTaskUpdateEmail(task, staffEmail, staffName, changes || {});
        break;

      case 'delegation':
        if (!staffId) {
          return NextResponse.json(
            { error: 'Missing staffId for delegation' },
            { status: 400 }
          );
        }
        
        // Fetch staff details
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('name, email')
          .eq('id', staffId)
          .single();

        if (staffError || !staff) {
          return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
          );
        }

        await sendTaskDelegationEmail(task, staff.email, staff.name, delegatedBy);
        break;

      case 'delegation_admin_notify':
        if (!adminEmail || !delegatedBy) {
          return NextResponse.json(
            { error: 'Missing adminEmail or delegatedBy for admin notification' },
            { status: 400 }
          );
        }
        await sendDelegationAdminNotification(task, delegatedBy, adminEmail);
        break;

      case 'rejection':
        if (!staffEmail || !staffName) {
          return NextResponse.json(
            { error: 'Missing staff email or name for rejection' },
            { status: 400 }
          );
        }
        await sendTaskRejectionEmail(task, staffEmail, staffName, rejectedBy || 'Admin');
        break;

      case 'approval':
        if (!staffEmail || !staffName) {
          return NextResponse.json(
            { error: 'Missing staff email or name for approval' },
            { status: 400 }
          );
        }
        await sendTaskApprovalEmail(task, staffEmail, staffName, approvedBy || 'Admin');
        break;

      case 'team_assignment':
        if (!teamName || !leaderEmail || !leaderName || teamMemberCount === undefined) {
          return NextResponse.json(
            { error: 'Missing team assignment parameters' },
            { status: 400 }
          );
        }
        await sendTeamTaskAssignmentEmail(
          task,
          teamName,
          leaderEmail,
          leaderName,
          teamMemberCount
        );
        break;

      case 'status_change':
        if (!adminEmail || !staffName || !oldStatus || !newStatus) {
          return NextResponse.json(
            { error: 'Missing status change parameters' },
            { status: 400 }
          );
        }
        await sendTaskStatusChangeEmail(
          task,
          adminEmail,
          staffName,
          oldStatus,
          newStatus
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending task notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

