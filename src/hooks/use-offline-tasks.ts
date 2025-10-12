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
  assigned_staff_ids: task.assigned_staff_ids || [],
  assigned_team_ids: task.assigned_team_ids || [],
  status: task.status,
  priority: task.priority,
  due_date: task.due_date,
  start_date: task.start_date,
  created_at: task.created_at,
  updated_at: task.updated_at,
  allocation_mode: task.allocation_mode,
  assigned_staff: task.assigned_staff,
  assigned_teams: task.assigned_teams,
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

  // Simple refresh function for instant UI updates
  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Force sync function for manual confirmation
  const forceSync = async () => {
    try {
      console.log('🚀 Force sync: Starting data synchronization...');
      
      // Force sync all data from Supabase
      await syncService.syncAll();
      
      // Invalidate and refetch all queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['offline-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['offline-staff'] }),
        queryClient.invalidateQueries({ queryKey: ['offline-teams'] }),
      ]);
      
      console.log('✅ Force sync completed successfully');
      
      // Trigger real-time update for other browser tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataUpdated'));
      }
      
    } catch (error) {
      console.error('❌ Error in force sync:', error);
      throw error;
    }
  };

  // Clear IndexedDB and refresh page function
  const clearIndexedDBAndRefresh = async () => {
    try {
      console.log('🔄 Clearing IndexedDB and refreshing page...');
      
      // Clear all IndexedDB data
      await offlineDB.tasks.clear();
      await offlineDB.taskAssignments.clear();
      await offlineDB.staff.clear();
      await offlineDB.teams.clear();
      await offlineDB.teamMembers.clear();
      
      console.log('✅ IndexedDB cleared successfully');
      
      // Wait a moment to ensure clearing is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh the page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Error clearing IndexedDB:', error);
      // Still refresh the page even if clearing fails
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  // State to track if we're on the client side
  const [isClient, setIsClient] = useState(false);

  // Set client state on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Query to fetch all tasks (offline-first)
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<OfflineTask[], Error>({
    queryKey: ["offline-tasks"],
    queryFn: async () => {
      try {
        console.log('🔍 Query function called, window:', typeof window);
        console.log('🔍 Client side, fetching tasks from IndexedDB');
        console.log('🔍 offlineDB available:', !!offlineDB);
        console.log('🔍 offlineDB.tasks available:', !!offlineDB.tasks);
        const tasksData = await offlineDB.tasks.orderBy('created_at').reverse().toArray();
        console.log('🔍 Tasks fetched from IndexedDB:', tasksData.length, tasksData);
      
      // Load related data for each task
      for (const task of tasksData) {
        // Load assigned staff
        if (task.assigned_staff_ids?.length > 0) {
          const assignedStaff = [];
          for (const staffId of task.assigned_staff_ids) {
            const staff = await offlineDB.staff.get(staffId);
            if (staff) {
              // Create a task assignment object
              const assignment = {
                id: `assignment-${task.id}-${staffId}`,
                task_id: task.id,
                staff_id: staffId,
                staff: staff,
                assigned_at: new Date().toISOString(),
                _isOffline: true,
                _lastSync: Date.now(),
              };
              assignedStaff.push(assignment);
            }
          }
          task.assigned_staff = assignedStaff;
        }

        // Load assigned teams
        if (task.assigned_team_ids?.length > 0) {
          const assignedTeams = [];
          for (const teamId of task.assigned_team_ids) {
            const team = await offlineDB.teams.get(teamId);
            if (team) {
              // Load team leader
              if (team.leader_id) {
                const leader = await offlineDB.staff.get(team.leader_id);
                if (leader) {
                  team.leader = leader;
                }
              }

              // Load team members
              const teamMembers = await offlineDB.teamMembers
                .where('team_id')
                .equals(teamId)
                .toArray();

              for (const member of teamMembers) {
                const staff = await offlineDB.staff.get(member.staff_id);
                if (staff) {
                  member.staff = staff;
                }
              }

              team.members = teamMembers;
              assignedTeams.push(team);
            }
          }
          task.assigned_teams = assignedTeams;
        }
      }
      
        console.log('🔍 Returning tasks data:', tasksData.length, tasksData);
        return tasksData;
      } catch (error) {
        console.error('❌ Error in query function:', error);
        return [];
      }
    },
    // Use default options from QueryProvider
    enabled: isClient, // Only run on client-side
  });

  // Create task mutation
  const createMutation = useMutation<
    { success: boolean; data?: OfflineTask; error?: string },
    Error,
    {
      title: string;
      description?: string;
      allocation_mode: 'individual' | 'team';
      assigned_staff_ids?: string[];
      assigned_team_ids?: string[];
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
              assigned_staff_ids: newTask.assigned_staff_ids || [],
              assigned_team_ids: newTask.assigned_team_ids || [],
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
          
          // Add task assignments to SUPABASE first - for both individual and team tasks
          if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
            // Team task - multiple staff assignments to Supabase
            const assignmentsToInsert = newTask.assigned_staff_ids.map(staffId => ({
              task_id: supabaseData.id,
              staff_id: staffId,
              assigned_at: new Date().toISOString(),
            }));
            
            const { error: assignmentsError } = await supabase
              .from('task_assignments')
              .insert(assignmentsToInsert);
            
            if (assignmentsError) {
              console.error('Failed to create task assignments in Supabase:', assignmentsError);
            } else {
              console.log(`Created ${assignmentsToInsert.length} task assignments in Supabase`);
            }
          }
          
          // Manually update IndexedDB to ensure consistency (bypasses real-time sync issues)
          await syncService.updateIndexedDBAfterSupabaseOperation('create', 'tasks', supabaseData);
          console.log('Task also added to IndexedDB for UI update');
          
          // Add task assignments to IndexedDB - for both individual and team tasks
          if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
            // Team task - multiple staff assignments
            for (const staffId of newTask.assigned_staff_ids) {
              // Check if assignment already exists to prevent duplicates
              const existingAssignments = await offlineDB.taskAssignments
                .where('task_id')
                .equals(supabaseData.id)
                .and(assignment => assignment.staff_id === staffId)
                .toArray();
              
              if (existingAssignments.length === 0) {
                const assignmentData: OfflineTaskAssignment = {
                  id: `assignment_${supabaseData.id}_${staffId}`,
                  task_id: supabaseData.id,
                  staff_id: staffId,
                  assigned_at: new Date().toISOString(),
                  _isOffline: false,
                  _lastSync: Date.now(),
                };
                
                await offlineDB.taskAssignments.put(assignmentData);
              } else {
                console.log(`Assignment already exists for task ${supabaseData.id} and staff ${staffId}`);
              }
            }
            console.log(`Created ${newTask.assigned_staff_ids.length} task assignments in IndexedDB`);
          }

          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: supabaseData
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
            assigned_staff_ids: newTask.assigned_staff_ids || [],
            assigned_team_ids: newTask.assigned_team_ids || [],
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

        // Add task assignments - for both individual and team tasks
        if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
          // Team task - multiple staff assignments
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
          assigned_staff_ids: newTask.assigned_staff_ids || [],
          assigned_team_ids: newTask.assigned_team_ids || [],
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date,
          start_date: newTask.start_date,
          is_repeated: newTask.is_repeated,
          repeat_config: newTask.repeat_config,
          support_files: newTask.support_files,
        });

        // Queue task assignments for sync - for both individual and team tasks
        if (newTask.assigned_staff_ids && newTask.assigned_staff_ids.length > 0) {
          // Team task - queue multiple assignments
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
          queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
          
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
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Task created successfully!");
        // Real-time sync will handle the update automatically
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
      allocation_mode?: 'individual' | 'team';
      status: 'backlog' | 'todo' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
      start_date?: string;
      is_repeated: boolean;
      repeat_config?: Record<string, unknown>;
      assigned_staff_ids?: string[];
      assigned_team_ids?: string[];
    }
  >({
    mutationFn: async (updateData) => {
      try {
        const existingTask = await offlineDB.tasks.get(updateData.id);
        if (!existingTask) {
          throw new Error("Task not found");
        }

        if (syncStatus.isOnline && !existingTask._isOffline) {
          // ONLINE: Update directly in Supabase
          console.log('Online mode: Updating task in Supabase...');
          
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('tasks')
            .update({
              title: updateData.title,
              description: updateData.description,
              allocation_mode: updateData.allocation_mode,
              status: updateData.status,
              priority: updateData.priority,
              due_date: updateData.due_date,
              start_date: updateData.start_date,
              is_repeated: updateData.is_repeated,
              repeat_config: updateData.repeat_config ? JSON.stringify(updateData.repeat_config) : undefined,
              assigned_staff_ids: updateData.assigned_staff_ids,
              assigned_team_ids: updateData.assigned_team_ids,
            })
            .eq('id', updateData.id)
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase update failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Task updated successfully in Supabase:', supabaseData);
          
          // Update task assignments - handle both individual and team tasks
          if (updateData.assigned_staff_ids !== undefined) {
            // Team task - remove existing assignments and add new ones
            await supabase
              .from('task_assignments')
              .delete()
              .eq('task_id', updateData.id);
            
            if (updateData.assigned_staff_ids.length > 0) {
              const assignmentsToInsert = updateData.assigned_staff_ids.map(staffId => ({
                task_id: updateData.id,
                staff_id: staffId,
                assigned_at: new Date().toISOString(),
              }));
              
              await supabase
                .from('task_assignments')
                .insert(assignmentsToInsert);
            }
          }

          // Also update in IndexedDB for immediate UI update
          const updatedTask: OfflineTask = {
            id: supabaseData.id,
            title: supabaseData.title,
            description: supabaseData.description,
            assigned_staff_ids: supabaseData.assigned_staff_ids || [],
            assigned_team_ids: supabaseData.assigned_team_ids || [],
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
          
          await offlineDB.tasks.put(updatedTask);
          
          // Update task assignments in IndexedDB - handle both individual and team tasks
          if (updateData.assigned_staff_ids !== undefined) {
            // Team task - remove existing and add new assignments
            await offlineDB.taskAssignments.where('task_id').equals(updateData.id).delete();
            
            for (const staffId of updateData.assigned_staff_ids) {
              const assignmentData: OfflineTaskAssignment = {
                id: `assignment_${updateData.id}_${staffId}`,
                task_id: updateData.id,
                staff_id: staffId,
                assigned_at: new Date().toISOString(),
                _isOffline: false,
                _lastSync: Date.now(),
              };
              
              await offlineDB.taskAssignments.put(assignmentData);
            }
          }
          
          console.log('Task also updated in IndexedDB for UI update');
          
          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: updatedTask
          };
        } else {
          // OFFLINE: Update locally only
          console.log('Offline mode: Updating task locally...');
          
          const updatedTask: Partial<OfflineTask> = {
            title: updateData.title,
            description: updateData.description,
            allocation_mode: updateData.allocation_mode,
            status: updateData.status,
            priority: updateData.priority,
            due_date: updateData.due_date,
            start_date: updateData.start_date,
            assigned_staff_ids: updateData.assigned_staff_ids,
            assigned_team_ids: updateData.assigned_team_ids,
            is_repeated: updateData.is_repeated,
            repeat_config: updateData.repeat_config ? JSON.stringify(updateData.repeat_config) : undefined,
            updated_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };

          // Update task in offline database
          await offlineDB.tasks.update(updateData.id, updatedTask);

          // Update task assignments if provided - handle both individual and team tasks
          if (updateData.assigned_staff_ids !== undefined) {
            // Team task - remove existing and add new assignments
            await offlineDB.taskAssignments.where('task_id').equals(updateData.id).delete();
            
            for (const staffId of updateData.assigned_staff_ids) {
              const assignmentData: OfflineTaskAssignment = {
                id: `offline_assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                task_id: updateData.id,
                staff_id: staffId,
                assigned_at: new Date().toISOString(),
                _isOffline: true,
                _lastSync: Date.now(),
              };
              
              await offlineDB.taskAssignments.add(assignmentData);
            }
          }

          // Queue for sync
          await syncService.queueOperation('tasks', 'update', {
            id: updateData.id,
            title: updateData.title,
            description: updateData.description,
            status: updateData.status,
            priority: updateData.priority,
            due_date: updateData.due_date,
            start_date: updateData.start_date,
            assigned_staff_ids: updateData.assigned_staff_ids,
            assigned_team_ids: updateData.assigned_team_ids,
            is_repeated: updateData.is_repeated,
            repeat_config: updateData.repeat_config ? JSON.stringify(updateData.repeat_config) : undefined,
          });

          // Queue task assignments for sync if provided
          if (updateData.assigned_staff_ids !== undefined) {
            await syncService.queueOperation('task_assignments', 'update', {
              task_id: updateData.id,
              assigned_staff_ids: updateData.assigned_staff_ids,
            });
          }

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: { ...existingTask, ...updatedTask } };
        }
      } catch (error) {
        console.error("Error updating task:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to update task" 
        };
      }
    },
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Task updated successfully!");
        // Real-time sync will handle the update automatically
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
        const existingTask = await offlineDB.tasks.get(taskId);
        if (!existingTask) {
          throw new Error("Task not found");
        }

        if (syncStatus.isOnline && !existingTask._isOffline) {
          // ONLINE: Delete directly from Supabase
          console.log('Online mode: Deleting task from Supabase...');
          
          try {
            // Delete task assignments first, then task - run in parallel where possible
            const [assignmentsResult, taskResult] = await Promise.all([
              supabase
                .from('task_assignments')
                .delete()
                .eq('task_id', taskId),
              supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)
            ]);

            if (assignmentsResult.error) {
              console.error('Failed to delete task assignments:', assignmentsResult.error);
              // Continue with task deletion even if assignments fail
            }

            if (taskResult.error) {
              console.error('Supabase task delete failed:', taskResult.error);
              throw taskResult.error;
            }

            console.log('Task deleted successfully from Supabase');
            
            // Manually update IndexedDB to ensure consistency (bypasses real-time sync issues)
            await syncService.updateIndexedDBAfterSupabaseOperation('delete', 'tasks', { id: taskId });
            console.log('Task also deleted from IndexedDB for UI update');
            
            // Invalidate and refetch to update UI
            queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
            
            // Dispatch custom event for real-time updates
            window.dispatchEvent(new CustomEvent('dataUpdated'));

            return { success: true };
          } catch (error) {
            console.error('Error during parallel deletion:', error);
            throw error;
          }
        } else {
          // OFFLINE: Delete locally only
          console.log('Offline mode: Deleting task locally...');
          
          // Delete task assignments first
          await offlineDB.taskAssignments.where('task_id').equals(taskId).delete();
          
          // Delete task
          await offlineDB.tasks.delete(taskId);

          // Queue for sync
          await syncService.queueOperation('tasks', 'delete', { id: taskId });

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-tasks"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true };
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to delete task" 
        };
      }
    },
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Task deleted successfully!");
        // Real-time sync will handle the update automatically
      } else {
        toast.error(result.error || "Failed to delete task.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete task.");
    },
  });

  // Debug logging
  console.log('🔍 useOfflineTasks Debug:', {
    rawTasks: tasks,
    rawTasksLength: tasks?.length,
    transformedTasks: tasks?.map(transformOfflineTask),
    transformedTasksLength: tasks?.map(transformOfflineTask)?.length,
    isLoading,
    error
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
    refreshPage,
    forceSync,
    clearIndexedDBAndRefresh,
  };
}
