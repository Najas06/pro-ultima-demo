"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Task, TaskFormData, UpdateTaskFormData, Staff } from "@/types";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTeamMembers,
} from "@/lib/actions/taskActions";

export function useTasks() {
  const queryClient = useQueryClient();

  // Query for fetching all tasks
  const { data, isLoading, error } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const result = await getAllTasks();
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation for creating a task
  const createMutation = useMutation<
    { success: boolean; data?: Task; error?: string },
    Error,
    TaskFormData,
    { previousTasks?: Task[] }
  >({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistic update
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        const tempId = `temp-${Date.now()}`;
        const tempTask: Task = {
          id: tempId,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return old ? [tempTask, ...old] : [tempTask];
      });

      return { previousTasks };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task created successfully!");
      } else {
        toast.error(result.error || "Failed to create task.");
      }
    },
    onError: (err, newTask, context) => {
      toast.error(err.message || "Failed to create task.");
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Mutation for updating a task
  const updateMutation = useMutation<
    { success: boolean; data?: Task; error?: string },
    Error,
    UpdateTaskFormData,
    { previousTasks?: Task[] }
  >({
    mutationFn: updateTask,
    onMutate: async (updatedTaskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistic update
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === updatedTaskData.id
            ? { ...task, ...updatedTaskData, updated_at: new Date().toISOString(), support_files: task.support_files }
            : task
        );
      });

      return { previousTasks };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task updated successfully!");
      } else {
        toast.error(result.error || "Failed to update task.");
      }
    },
    onError: (err, updatedTaskData, context) => {
      toast.error(err.message || "Failed to update task.");
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Mutation for deleting a task
  const deleteMutation = useMutation<
    { success: boolean; error?: string },
    Error,
    string,
    { previousTasks?: Task[] }
  >({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistic update
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== taskId);
      });

      return { previousTasks };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Task deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete task.");
      }
    },
    onError: (err, taskId, context) => {
      toast.error(err.message || "Failed to delete task.");
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    tasks: data || [],
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook for fetching a single task
export function useTask(taskId: string) {
  return useQuery<Task | null>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const result = await getTaskById(taskId);
      return result.data || null;
    },
    enabled: !!taskId,
  });
}

// Hook for fetching team members
export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const result = await getTeamMembers(teamId);
      return (result.data || []) as Staff[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
