"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offlineDB, OfflineTask, OfflineTaskAssignment } from "@/lib/offline/database";
import { syncService } from "@/lib/offline/sync-service";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Transform offline task to match the expected Task interface
const transformOfflineTask = (task: OfflineTask) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  assignee_id: task.assignee_id,
  assignee: task.assignee,
  status: task.status,
  priority: task.priority,
  due_date: task.due_date,
  start_date: task.start_date,
  created_at: task.created_at,
  updated_at: task.updated_at,
  allocation_mode: task.allocation_mode,
  team_id: task.team_id,
  team: task.team,
  assigned_staff: task.assigned_staff,
  is_repeated: task.is_repeated,
  repeat_config: task.repeat_config ? 
    (typeof task.repeat_config === 'string' ? 
      (() => {
        try {
          return JSON.parse(task.repeat_config);
        } catch (error) {
          console.warn('Failed to parse repeat_config:', task.repeat_config, error);
          return undefined;
        }
      })() : 
      task.repeat_config
    ) : 
    undefined,
  support_files: task.support_files,
});

export function useOfflineTasks() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [syncStatus, setSyncStatus] = useState(() => {
    // Only access syncService on client-side
    if (typeof window === 'undefined') return { isOnline: false, isSyncing: false, lastSync: null, pendingOperations: 0 };
    return syncService.getStatus();
  });

  // Subscribe to sync status changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Listen for real-time data updates from other devices/browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleDataUpdate = () => {
      console.log('🔄 Real-time update detected - refreshing tasks data');
      queryClient.invalidateQueries({ queryKey: ['offline-tasks'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    return () => window.removeEventListener('dataUpdated', handleDataUpdate);
  }, [queryClient]);

  // Query to fetch all tasks (offline-first)
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<OfflineTask[], Error>({
    queryKey: ["offline-tasks"],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
      const tasksData = await offlineDB.tasks.orderBy('created_at').reverse().toArray();
      
      // Load related data for each task
      for (const task of tasksData) {
        // Load assignee
        if (task.assignee_id) {
          const assignee = await offlineDB.staff.get(task.assignee_id);
          if (assignee) {
            task.assignee = assignee;
          }
        }

        // Load team
        if (task.team_id) {
          const team = await offlineDB.teams.get(task.team_id);
          if (team) {
            task.team = team;
          }
        }

        // Load task assignments
        const assignments = await offlineDB.taskAssignments
          .where('task_id')
          .equals(task.id)
          .toArray();
        
        // Load staff data for each assignment
        for (const assignment of assignments) {
          const staff = await offlineDB.staff.get(assignment.staff_id);
          if (staff) {
            assignment.staff = staff;
          }
        }
        
        task.assigned_staff = assignments;
      }
      
      return tasksData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: typeof window !== 'undefined', // Only run on client-side
  });

  // Create task mutation
  const createMutation = useMutation<
    { success: boolean; data?: OfflineTask; error?: string },
    Error,
    {
      title: string;
      description?: string;
      allocation_mode: 'individual' | 'team';
      assignee_id?: string;
      team_id?: string;
      assigned_staff_ids?: string[];
      status: 'backlog' | 'todo' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
      start_date?: string;
      is_repeated: boolean;
      repeat_config?: Record<string, unknown>;
      support_files?: string[];
    }
  >({
    mutationFn: async (newTask) => {
      try {
        if (syncStatus.isOnline) {
          // ONLINE: Create directly in Supabase first
          console.log('Online mode: Creating task in Supabase...');
          
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('tasks')
            .insert({
              title: newTask.title,
              description: newTask.description,
              allocation_mode: newTask.allocation_mode,
              assignee_id: newTask.assignee_id,
              team_id: newTask.team_id,
              status: newTask.status,
              priority: newTask.priority,
              due_date: newTask.due_date,
              start_date: newTask.start_date,
              is_repeated: newTask.is_repeated,
              repeat_config: newTask.repeat_config ? JSON.stringify(newTask.repeat_config) : undefined,
              support_files: newTask.support_files,
            })
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase create failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Task created successfully in Supabase:', supabaseData);
          
          // Also add to IndexedDB for immediate UI update
          const taskData: OfflineTask = {
            id: supabaseData.id,
            title: supabaseData.title,
            description: supabaseData.description,
            assignee_id: supabaseData.assignee_id,
            team_id: supabaseData.team_id,
            status: supabaseData.status,
            priority: supabaseData.priority,
            due_date: supabaseData.due_date,
            start_date: supabaseData.start_date,
            allocation_mode: supabaseData.allocation_mode,
            is_repeated: supabaseData.is_repeated,
            repeat_config: supabaseData.repeat_config,
            support_files: supabaseData.support_files,
            created_at: supabaseData.created_at,
            updated_at: supabaseData.updated_at,
            _isOffline: false,
            _lastSync: Date.now(),
          };
          
          await offlineDB.tasks.put(taskData);
          console.log('Task also added to IndexedDB for UI update');
          
          // Add task assignments if provided
          if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
            for (const staffId of newTask.assigned_staff_ids) {
              const assignmentData: OfflineTaskAssignment = {
                id: `assignment_${supabaseData.id}_${staffId}`,
                task_id: supabaseData.id,
                staff_id: staffId,
                assigned_at: new Date().toISOString(),
                _isOffline: false,
                _lastSync: Date.now(),
              };
              
              await offlineDB.taskAssignments.put(assignmentData);
            }
          }

          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          await queryClient.refetchQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: taskData
          };
        } else {
          // OFFLINE: Local storage only
          console.log('Offline mode: Storing task locally...');
          
          // Generate offline ID
          const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const taskData: OfflineTask = {
            id: offlineId,
            title: newTask.title,
            description: newTask.description,
            assignee_id: newTask.assignee_id,
            team_id: newTask.team_id,
            status: newTask.status,
            priority: newTask.priority,
            due_date: newTask.due_date,
            start_date: newTask.start_date,
            allocation_mode: newTask.allocation_mode,
            is_repeated: newTask.is_repeated,
            repeat_config: newTask.repeat_config ? JSON.stringify(newTask.repeat_config) : undefined,
            support_files: newTask.support_files,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };

          // Add task to offline database
          await offlineDB.tasks.add(taskData);

        // Add task assignments if provided
        if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
          for (const staffId of newTask.assigned_staff_ids) {
            const assignmentData: OfflineTaskAssignment = {
              id: `offline_assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              task_id: offlineId,
              staff_id: staffId,
              assigned_at: new Date().toISOString(),
              _isOffline: true,
              _lastSync: Date.now(),
            };
            
            await offlineDB.taskAssignments.add(assignmentData);
          }
        }

        // Queue for sync
        await syncService.queueOperation('tasks', 'create', {
          title: newTask.title,
          description: newTask.description,
          allocation_mode: newTask.allocation_mode,
          assignee_id: newTask.assignee_id,
          team_id: newTask.team_id,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date,
          start_date: newTask.start_date,
          is_repeated: newTask.is_repeated,
          repeat_config: newTask.repeat_config,
          support_files: newTask.support_files,
        });

        // Queue task assignments for sync
        if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
          for (const staffId of newTask.assigned_staff_ids) {
            await syncService.queueOperation('task_assignments', 'create', {
              task_id: offlineId,
              staff_id: staffId,
              assigned_at: new Date().toISOString(),
            });
          }
        }

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          await queryClient.refetchQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: taskData };
        }
      } catch (error) {
        console.error("Error creating task:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to create task" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task created successfully!");
      } else {
        toast.error(result.error || "Failed to create task.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create task.");
    },
  });

  // Update task mutation
  const updateMutation = useMutation<
    { success: boolean; data?: OfflineTask; error?: string },
    Error,
    {
      id: string;
      title: string;
      description?: string;
      status: 'backlog' | 'todo' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
      start_date?: string;
      is_repeated: boolean;
      repeat_config?: Record<string, unknown>;
    }
  >({
    mutationFn: async (updateData) => {
      try {
        const existingTask = await offlineDB.tasks.get(updateData.id);
        if (!existingTask) {
          throw new Error("Task not found");
        }

        const updatedTask: Partial<OfflineTask> = {
          title: updateData.title,
          description: updateData.description,
          status: updateData.status,
          priority: updateData.priority,
          due_date: updateData.due_date,
          start_date: updateData.start_date,
          is_repeated: updateData.is_repeated,
          repeat_config: updateData.repeat_config ? JSON.stringify(updateData.repeat_config) : undefined,
          updated_at: new Date().toISOString(),
          _isOffline: true,
          _lastSync: Date.now(),
        };

        // Update task in offline database
        await offlineDB.tasks.update(updateData.id, updatedTask);

        // Queue for sync
        await syncService.queueOperation('tasks', 'update', {
          id: updateData.id,
          title: updateData.title,
          description: updateData.description,
          status: updateData.status,
          priority: updateData.priority,
          due_date: updateData.due_date,
          start_date: updateData.start_date,
          is_repeated: updateData.is_repeated,
          repeat_config: updateData.repeat_config ? JSON.stringify(updateData.repeat_config) : undefined,
        });

        // Invalidate and refetch
        await queryClient.refetchQueries({ queryKey: ["offline-tasks"] });

        // Trigger cross-browser sync
        syncService.triggerCrossBrowserSync();

        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('dataUpdated'));

        return { success: true, data: { ...existingTask, ...updatedTask } };
      } catch (error) {
        console.error("Error updating task:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to update task" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task updated successfully!");
      } else {
        toast.error(result.error || "Failed to update task.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task.");
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation<
    { success: boolean; error?: string },
    Error,
    string
  >({
    mutationFn: async (taskId) => {
      try {
        // Delete task assignments first
        await offlineDB.taskAssignments.where('task_id').equals(taskId).delete();
        
        // Delete task
        await offlineDB.tasks.delete(taskId);

        // Queue for sync
        await syncService.queueOperation('tasks', 'delete', { id: taskId });

        // Invalidate and refetch
        await queryClient.refetchQueries({ queryKey: ["offline-tasks"] });

        // Trigger cross-browser sync
        syncService.triggerCrossBrowserSync();
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('dataUpdated'));

        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to delete task" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete task.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete task.");
    },
  });

  return {
    // Data
    tasks: tasks?.map(transformOfflineTask) || [],
    isLoading,
    error,
    
    // Sync status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingOperations: syncStatus.pendingOperations,
    
    // Mutations
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    downloadData: syncService.downloadData.bind(syncService),
    syncAll: syncService.syncAll.bind(syncService),
  };
}
