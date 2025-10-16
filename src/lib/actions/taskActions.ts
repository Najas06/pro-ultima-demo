"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Task, TaskFormData, UpdateTaskFormData } from "@/types";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const repeatConfigSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().min(1).max(365),
  end_date: z.string().optional(),
  custom_days: z.array(z.number().min(0).max(6)).optional(),
  has_specific_time: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  allocation_mode: z.enum(['individual', 'team']),
  assignee_id: z.string().optional().nullable(),
  team_id: z.string().optional().nullable(),
  assigned_staff_ids: z.array(z.string()).optional().nullable(),
  assigned_team_ids: z.array(z.string()).optional().nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  is_repeated: z.boolean(),
  repeat_config: repeatConfigSchema.optional().nullable(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function uploadSupportFiles(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const supabase = await createClient();
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `task-files/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error } = await supabase.storage
      .from('task-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('File upload error:', error);
      continue;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('task-files')
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

// ============================================
// CREATE TASK
// ============================================

export async function createTask(formData: TaskFormData) {
  try {
    // Validate input
    const validatedData = taskFormSchema.parse(formData);

    const supabase = await createClient();

    // Use support files URLs (already uploaded in the dialog)
    const supportFileUrls: string[] = formData.support_files || [];

    // Create task record
    const taskData = {
      title: validatedData.title,
      description: validatedData.description,
      allocation_mode: validatedData.allocation_mode,
      assignee_id: validatedData.assignee_id,
      team_id: validatedData.team_id,
      status: validatedData.status,
      priority: validatedData.priority,
      due_date: validatedData.due_date,
      start_date: validatedData.start_date,
      is_repeated: validatedData.is_repeated,
      repeat_config: validatedData.repeat_config,
      support_files: supportFileUrls.length > 0 ? supportFileUrls : null,
    };

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error('Task creation error:', taskError);
      return { success: false, error: taskError.message };
    }

    // Handle team task assignments
    if (validatedData.allocation_mode === 'team' && validatedData.assigned_team_ids && validatedData.assigned_team_ids.length > 0) {
      console.log('📋 Creating task_team_assignments for teams:', validatedData.assigned_team_ids);
      
      // 1. Create task_team_assignments entries
      const teamAssignments = validatedData.assigned_team_ids.map(teamId => ({
        task_id: task.id,
        team_id: teamId,
      }));

      const { error: teamAssignmentError } = await supabase
        .from('task_team_assignments')
        .insert(teamAssignments);

      if (teamAssignmentError) {
        console.error('❌ Task team assignment error:', teamAssignmentError);
      } else {
        console.log('✅ Task team assignments created successfully');
      }

      // 2. Fetch team members and populate assigned_staff_ids
      console.log('👥 Fetching team members for teams:', validatedData.assigned_team_ids);
      
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('staff_id')
        .in('team_id', validatedData.assigned_team_ids);

      if (teamMembers && teamMembers.length > 0) {
        const memberIds = teamMembers.map(m => m.staff_id);
        console.log('✅ Found team members:', memberIds);
        
        // Update task with assigned_staff_ids
        await supabase
          .from('tasks')
          .update({ assigned_staff_ids: memberIds })
          .eq('id', task.id);
        
        // Create task_assignments for each team member
        const assignments = memberIds.map(staffId => ({
          task_id: task.id,
          staff_id: staffId,
        }));

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('❌ Task assignment error:', assignmentError);
        } else {
          console.log('✅ Task assignments created for team members');
        }
      }

      // 3. Send email notification to team leaders
      console.log('📧 Attempting to send team assignment notification...');
      console.log('📧 Assigned team IDs:', validatedData.assigned_team_ids);
      
      try {
        // Fetch team details with leader info
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            leader:staff!leader_id(
              email,
              name
            ),
            members:team_members(id)
          `)
          .in('id', validatedData.assigned_team_ids);

        if (teamsError) {
          console.error('❌ Error fetching team details:', teamsError);
          return { success: true, data: task as Task };
        }

        console.log('📊 Fetched teams for notification:', JSON.stringify(teams, null, 2));

        if (teams && teams.length > 0) {
          // Import email function dynamically
          const { sendTeamTaskAssignmentEmail } = await import('@/lib/email');
          
          for (const team of teams) {
            const leader = Array.isArray(team.leader) ? team.leader[0] : team.leader;
            const memberCount = team.members?.length || 0;
            
            console.log(`📧 Team: ${team.name}, Leader:`, leader, `Members: ${memberCount}`);
            
            if (leader?.email && leader?.name) {
              console.log(`✉️ Sending email to: ${leader.name} (${leader.email})`);
              
              try {
                await sendTeamTaskAssignmentEmail(
                  task,
                  team.name,
                  leader.email,
                  leader.name,
                  memberCount
                );
                console.log(`✅ Email sent successfully to ${leader.name}`);
              } catch (emailError) {
                console.error(`❌ Failed to send email to ${leader.name}:`, emailError);
              }
            } else {
              console.warn(`⚠️ Team ${team.name} has incomplete leader data:`, leader);
            }
          }
        } else {
          console.warn('⚠️ No teams found for IDs:', validatedData.assigned_team_ids);
        }
      } catch (error) {
        console.error('❌ Error in team notification process:', error);
      }
    }

    // Handle individual task assignments (existing logic)
    if (validatedData.allocation_mode === 'individual' && validatedData.assigned_staff_ids && validatedData.assigned_staff_ids.length > 0) {
      const assignments = validatedData.assigned_staff_ids.map(staffId => ({
        task_id: task.id,
        staff_id: staffId,
      }));

      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Task assignment error:', assignmentError);
        // Don't fail the entire operation, just log the error
      }
    }

    return { success: true, data: task as Task };
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create task' };
  }
}

// ============================================
// GET ALL TASKS
// ============================================

export async function getAllTasks() {
  try {
    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:staff!tasks_assignee_id_fkey(
          id,
          name,
          email,
          role,
          department,
          branch,
          phone,
          profile_image_url
        ),
        team:teams(
          id,
          name,
          description,
          branch
        ),
        assigned_staff:task_assignments(
          id,
          staff_id,
          assigned_at,
          staff:staff(
            id,
            name,
            email,
            role,
            department,
            branch,
            phone,
            profile_image_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get tasks error:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: tasks as Task[] };
  } catch (error) {
    console.error('Get tasks error:', error);
    return { success: false, error: 'Failed to fetch tasks', data: [] };
  }
}

// ============================================
// GET TASK BY ID
// ============================================

export async function getTaskById(taskId: string) {
  try {
    const supabase = await createClient();

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:staff!tasks_assignee_id_fkey(
          id,
          name,
          email,
          role,
          department,
          branch,
          phone,
          profile_image_url
        ),
        team:teams(
          id,
          name,
          description,
          branch
        ),
        assigned_staff:task_assignments(
          id,
          staff_id,
          assigned_at,
          staff:staff(
            id,
            name,
            email,
            role,
            department,
            branch,
            phone,
            profile_image_url
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Get task error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: task as Task };
  } catch (error) {
    console.error('Get task error:', error);
    return { success: false, error: 'Failed to fetch task' };
  }
}

// ============================================
// UPDATE TASK
// ============================================

export async function updateTask(formData: UpdateTaskFormData) {
  try {
    const validatedData = taskFormSchema.parse(formData);

    const supabase = await createClient();

    // Use support files URLs (already uploaded in the dialog)
    const supportFileUrls: string[] = formData.support_files || [];

    // Update task record
    const taskData = {
      title: validatedData.title,
      description: validatedData.description,
      allocation_mode: validatedData.allocation_mode,
      assignee_id: validatedData.assignee_id,
      team_id: validatedData.team_id,
      status: validatedData.status,
      priority: validatedData.priority,
      due_date: validatedData.due_date,
      start_date: validatedData.start_date,
      is_repeated: validatedData.is_repeated,
      repeat_config: validatedData.repeat_config,
      ...(supportFileUrls.length > 0 && { support_files: supportFileUrls }),
      updated_at: new Date().toISOString(),
    };

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', formData.id)
      .select()
      .single();

    if (taskError) {
      console.error('Task update error:', taskError);
      return { success: false, error: taskError.message };
    }

    // Update task assignments for team mode
    if (validatedData.allocation_mode === 'team' && validatedData.assigned_staff_ids) {
      // Delete existing assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', formData.id);

      // Create new assignments
      if (validatedData.assigned_staff_ids.length > 0) {
        const assignments = validatedData.assigned_staff_ids.map(staffId => ({
          task_id: formData.id,
          staff_id: staffId,
        }));

        await supabase
          .from('task_assignments')
          .insert(assignments);
      }
    }

    return { success: true, data: task as Task };
  } catch (error) {
    console.error('Update task error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update task' };
  }
}

// ============================================
// DELETE TASK
// ============================================

export async function deleteTask(taskId: string) {
  try {
    const supabase = await createClient();

    // Delete task assignments first
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId);

    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Delete task error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

// ============================================
// GET TEAM MEMBERS (Helper for UI)
// ============================================

export async function getTeamMembers(teamId: string) {
  try {
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        staff_id,
        staff:staff(
          id,
          name,
          email,
          role,
          department,
          branch,
          phone,
          profile_image_url
        )
      `)
      .eq('team_id', teamId);

    if (error) {
      console.error('Get team members error:', error);
      return { success: false, error: error.message, data: [] };
    }

    const staffList = members.map(m => m.staff).filter(Boolean);
    return { success: true, data: staffList };
  } catch (error) {
    console.error('Get team members error:', error);
    return { success: false, error: 'Failed to fetch team members', data: [] };
  }
}
