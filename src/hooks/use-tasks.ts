'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { debounce } from '@/lib/debounce';
import type { Task, TaskStatus, TaskPriority, TaskRepeatConfig } from '@/types';

interface TaskFormData {
  title: string;
  description?: string;
  allocation_mode: 'individual' | 'team';
  assigned_staff_ids?: string[];
  assigned_team_ids?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  start_date?: string;
  is_repeated?: boolean;
  repeat_config?: TaskRepeatConfig;
  support_files?: string[];
}

export function useTasks() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all tasks with related data
  const { data: tasks = [], isLoading, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      // Fetch tasks with staff and team assignments
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_staff:task_assignments(
            id,
            staff_id,
            staff:staff(
              id,
              name,
              email,
              role,
              department,
              branch,
              profile_image_url
            )
          ),
          assigned_teams:task_team_assignments(
            id,
            team_id,
            team:teams(
              id,
              name,
              leader_id,
              branch
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Raw tasksData from Supabase:', JSON.stringify(tasksData?.slice(0, 1), null, 2));

      if (tasksError) throw tasksError;
      
      // Fetch all delegations to enrich task data
      const { data: delegations } = await supabase
        .from('task_delegations')
        .select(`
          task_id,
          from_staff_id,
          to_staff_id,
          from_staff:staff!task_delegations_from_staff_id_fkey(id, name),
          to_staff:staff!task_delegations_to_staff_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      // Create a map of latest delegation per task
      const delegationMap = new Map();
      (delegations || []).forEach((del: any) => {
        if (!delegationMap.has(del.task_id)) {
          const fromStaff = Array.isArray(del.from_staff) ? del.from_staff[0] : del.from_staff;
          const toStaff = Array.isArray(del.to_staff) ? del.to_staff[0] : del.to_staff;
          
          delegationMap.set(del.task_id, {
            delegated_from_staff_id: del.from_staff_id,
            delegated_by_staff_name: fromStaff?.name || null,
            delegated_to_staff_id: del.to_staff_id,
            delegated_to_staff_name: toStaff?.name || null
          });
        }
      });
      
      // Map tasks with delegation info and ensure arrays are always present
      const tasksWithEnrichedData = await Promise.all((tasksData || []).map(async (task) => {
        let enrichedStaff = task.assigned_staff || [];
        
        // FALLBACK: If assigned_staff is empty but assigned_staff_ids has data, fetch directly
        if ((!enrichedStaff || enrichedStaff.length === 0) && task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
          console.log(`🔄 Fetching staff details directly for task ${task.id} with staff IDs:`, task.assigned_staff_ids);
          
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, name, email, role, department, branch, profile_image_url')
            .in('id', task.assigned_staff_ids);
          
          // Transform to match TaskAssignment structure
          enrichedStaff = (staffData || []).map(staff => ({
            id: `fallback-${staff.id}`,
            staff_id: staff.id,
            staff: staff
          }));
          
          console.log(`✅ Fetched ${enrichedStaff.length} staff members directly`);
        }
        
        // TEAM FALLBACK: If this is a team assignment and we have team IDs, fetch team members
        if (task.allocation_mode === 'team' && task.assigned_team_ids && task.assigned_team_ids.length > 0) {
          console.log(`🔄 Fetching team members for task ${task.id} with team IDs:`, task.assigned_team_ids);
          
          // Fetch team members from team_members table
          const { data: teamMembersData } = await supabase
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
                profile_image_url
              )
            `)
            .in('team_id', task.assigned_team_ids);
          
          // Transform to match TaskAssignment structure
          const teamStaff = (teamMembersData || []).map(member => ({
            id: `team-${member.staff_id}`,
            staff_id: member.staff_id,
            staff: member.staff
          }));
          
          // Combine with existing staff (if any)
          enrichedStaff = [...enrichedStaff, ...teamStaff];
          
          console.log(`✅ Fetched ${teamStaff.length} team members for ${task.assigned_team_ids.length} teams`);
        }
        
        return {
          ...task,
          assigned_staff: enrichedStaff,
          assigned_teams: task.assigned_teams || [],
          delegated_from_staff_id: delegationMap.get(task.id)?.delegated_from_staff_id || null,
          delegated_by_staff_name: delegationMap.get(task.id)?.delegated_by_staff_name || null,
          delegated_to_staff_id: delegationMap.get(task.id)?.delegated_to_staff_id || null,
          delegated_to_staff_name: delegationMap.get(task.id)?.delegated_to_staff_name || null
        };
      }));
      
      return tasksWithEnrichedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
    refetchOnWindowFocus: false, // Disable - we have real-time
    // Removed refetchInterval - real-time subscriptions handle updates
  });

  // Debounced invalidation to prevent excessive refetches
  const debouncedInvalidate = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        // Trigger cross-tab sync
        window.dispatchEvent(new CustomEvent('dataUpdated'));
        localStorage.setItem('data-sync-trigger', Date.now().toString());
      }, 300), // Reduced to 300ms for faster updates
    [queryClient]
  );

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('📡 Tasks table changed:', payload);
          debouncedInvalidate(); // Use debounced version
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments' },
        (payload) => {
          console.log('📡 Task assignments changed:', payload);
          debouncedInvalidate(); // Use debounced version
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_delegations' },
        (payload) => {
          console.log('📡 Task delegations changed:', payload);
          debouncedInvalidate(); // Use debounced version
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected: tasks');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: tasks');
        }
      });

    return () => {
      debouncedInvalidate.cancel(); // Cancel pending debounces
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, debouncedInvalidate]);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      // 1. Get last task number to auto-generate next one
      const { data: lastTask } = await supabase
        .from('tasks')
        .select('task_no')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 2. Generate next task number
      let nextTaskNo = 'T001';
      if (lastTask?.task_no) {
        const lastNum = parseInt(lastTask.task_no.replace('T', ''));
        nextTaskNo = `T${String(lastNum + 1).padStart(3, '0')}`;
      }

      // 3. Insert task with auto-generated task number
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title,
          description: formData.description,
          allocation_mode: formData.allocation_mode,
          assigned_staff_ids: formData.assigned_staff_ids || [],
          assigned_team_ids: formData.assigned_team_ids || [],
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date,
          start_date: formData.start_date,
          is_repeated: formData.is_repeated || false,
          repeat_config: formData.repeat_config,
          support_files: formData.support_files || [],
          task_no: nextTaskNo, // Auto-generated task number
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks'], [
          {
            id: 'temp-' + Date.now(),
            ...newTask,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Task,
          ...previousTasks,
        ]);
      }

      return { previousTasks };
    },
    onSuccess: async (result) => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Send email notifications to assigned staff
      if (result.assigned_staff_ids && result.assigned_staff_ids.length > 0) {
        try {
          const { data: staffData } = await supabase
            .from('staff')
            .select('email, name')
            .in('id', result.assigned_staff_ids);

          if (staffData && staffData.length > 0) {
            for (const staff of staffData) {
              await fetch('/api/email/send-task-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: result.id,
                  staffEmail: staff.email,
                  staffName: staff.name,
                  type: 'assignment',
                }),
              });
            }
          }
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to create task: ' + (error as Error).message);
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks'],
          previousTasks.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        );
      }

      return { previousTasks };
    },
    onSuccess: async (result) => {
      toast.success('Task updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Send email notifications to assigned staff about changes
      if (result.assigned_staff_ids && result.assigned_staff_ids.length > 0) {
        try {
          const { data: staffData } = await supabase
            .from('staff')
            .select('email, name')
            .in('id', result.assigned_staff_ids);

          if (staffData && staffData.length > 0) {
            for (const staff of staffData) {
              await fetch('/api/email/send-task-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: result.id,
                  staffEmail: staff.email,
                  staffName: staff.name,
                  type: 'update',
                  changes: result,
                }),
              });
            }
          }
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
      
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to update task: ' + (error as Error).message);
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks'],
          previousTasks.filter((task) => task.id !== deletedId)
        );
      }

      return { previousTasks };
    },
    onSuccess: () => {
      toast.success('Task deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to delete task: ' + (error as Error).message);
    },
  });

  // Approve task mutation
  const approveTask = (taskId: string) => {
    updateMutation.mutate({ id: taskId, status: 'completed' });
  };

  // Reject task mutation - change back to in_progress so staff can redo
  const rejectTask = (taskId: string) => {
    updateMutation.mutate({ id: taskId, status: 'in_progress' });
  };

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    approveTask,
    rejectTask,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
