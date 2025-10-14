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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
