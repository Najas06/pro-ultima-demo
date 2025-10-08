"use server";

import { createClient } from "@/lib/supabase/server";
import { Task, Staff, Team } from "@/types";

// ============================================
// DASHBOARD DATA FETCHING
// ============================================

export async function getDashboardData() {
  try {
    const supabase = await createClient();

    // Fetch tasks with assignee and team relationships
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:staff!tasks_assignee_id_fkey(*),
        team:teams(*),
        assigned_staff:task_assignments(
          staff_id,
          staff:staff(*)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return {
        success: false,
        error: "Failed to fetch tasks",
        data: null,
      };
    }

    // Fetch all staff (no filters to get all records)
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100); // Get up to 100 staff members

    if (staffError) {
      console.error("Error fetching staff:", staffError);
      return {
        success: false,
        error: "Failed to fetch staff",
        data: null,
      };
    }

    // Fetch teams with leader and members
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select(`
        *,
        leader:staff!teams_leader_id_fkey(*),
        members:team_members(
          id,
          team_id,
          staff_id,
          joined_at,
          staff:staff(*)
        )
      `)
      .order("created_at", { ascending: false });

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return {
        success: false,
        error: "Failed to fetch teams",
        data: null,
      };
    }

    // Calculate statistics
    const stats = {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter(task => task.status === "completed").length || 0,
      inProgressTasks: tasks?.filter(task => task.status === "in_progress").length || 0,
      todoTasks: tasks?.filter(task => task.status === "todo").length || 0,
      backlogTasks: tasks?.filter(task => task.status === "backlog").length || 0,
      totalStaff: staff?.length || 0,
      totalTeams: teams?.length || 0,
      urgentTasks: tasks?.filter(task => task.priority === "urgent").length || 0,
      highPriorityTasks: tasks?.filter(task => task.priority === "high").length || 0,
      overdueTasks: tasks?.filter(task => 
        task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed"
      ).length || 0,
    };

    return {
      success: true,
      data: {
        tasks: (tasks || []) as Task[],
        staff: (staff || []) as Staff[],
        teams: (teams || []) as Team[],
        stats,
      },
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

// ============================================
// RECENT ACTIVITY
// ============================================

export async function getRecentActivity(limit: number = 10) {
  try {
    const supabase = await createClient();

    // Get recently created tasks
    const { data: recentTasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:staff!tasks_assignee_id_fkey(name),
        team:teams(name)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tasksError) {
      console.error("Error fetching recent tasks:", tasksError);
      return {
        success: false,
        error: "Failed to fetch recent activity",
        data: null,
      };
    }

    // Get recently updated tasks
    const { data: updatedTasks, error: updatedError } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:staff!tasks_assignee_id_fkey(name),
        team:teams(name)
      `)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (updatedError) {
      console.error("Error fetching updated tasks:", updatedError);
    }

    return {
      success: true,
      data: {
        recentTasks: recentTasks || [],
        updatedTasks: updatedTasks || [],
      },
    };
  } catch (error) {
    console.error("Recent activity fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

// ============================================
// TASK STATISTICS BY DATE RANGE
// ============================================

export async function getTaskStatsByDateRange(startDate: string, endDate: string) {
  try {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching task stats:", error);
      return {
        success: false,
        error: "Failed to fetch task statistics",
        data: null,
      };
    }

    // Group tasks by date
    interface TasksByDateEntry {
      date: string;
      total: number;
      completed: number;
      inProgress: number;
      todo: number;
      backlog: number;
    }

    const tasksByDate = tasks?.reduce((acc: Record<string, TasksByDateEntry>, task) => {
      const date = new Date(task.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          backlog: 0,
        };
      }
      acc[date].total++;
      const statusKey = task.status === "in_progress" ? "inProgress" : task.status;
      if (statusKey in acc[date]) {
        acc[date][statusKey as keyof Omit<TasksByDateEntry, 'date' | 'total'>]++;
      }
      return acc;
    }, {});

    return {
      success: true,
      data: Object.values(tasksByDate || {}),
    };
  } catch (error) {
    console.error("Task stats fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

// ============================================
// TEAM PERFORMANCE
// ============================================

export async function getTeamPerformance() {
  try {
    const supabase = await createClient();

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select(`
        *,
        members:team_members(count)
      `);

    if (teamsError) {
      console.error("Error fetching team performance:", teamsError);
      return {
        success: false,
        error: "Failed to fetch team performance",
        data: null,
      };
    }

    // Get tasks for each team
    const teamsWithTasks = await Promise.all(
      (teams || []).map(async (team) => {
        const { data: teamTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("team_id", team.id);

        return {
          ...team,
          totalTasks: teamTasks?.length || 0,
          completedTasks: teamTasks?.filter(t => t.status === "completed").length || 0,
          inProgressTasks: teamTasks?.filter(t => t.status === "in_progress").length || 0,
        };
      })
    );

    return {
      success: true,
      data: teamsWithTasks,
    };
  } catch (error) {
    console.error("Team performance fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}
