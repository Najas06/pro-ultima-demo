"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeams,
} from "@/lib/actions/teamActions";
import type { Team, TeamFormData, UpdateTeamFormData } from "@/types";

export function useTeams() {
  const queryClient = useQueryClient();

  // Query to fetch all teams
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery<Team[], Error>({
    queryKey: ["teams"],
    queryFn: getAllTeams,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation for creating a team
  const createMutation = useMutation<
    { success: boolean; data?: Team; error?: string },
    Error,
    TeamFormData,
    { previousTeams?: Team[] }
  >({
    mutationFn: createTeam,
    onMutate: async (newTeam) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previousTeams = queryClient.getQueryData<Team[]>(["teams"]);

      // Optimistic update
      queryClient.setQueryData<Team[]>(["teams"], (old) => {
        const tempId = `temp-${Date.now()}`;
        const tempTeam: Team = {
          id: tempId,
          name: newTeam.name,
          description: newTeam.description,
          leader_id: newTeam.leader_id,
          branch: newTeam.branch,
          members: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return old ? [tempTeam, ...old] : [tempTeam];
      });

      return { previousTeams };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team created successfully!");
      } else {
        toast.error(result.error || "Failed to create team.");
      }
    },
    onError: (err, newTeam, context) => {
      toast.error(err.message || "Failed to create team.");
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // Mutation for updating a team
  const updateMutation = useMutation<
    { success: boolean; data?: Team; error?: string },
    Error,
    UpdateTeamFormData,
    { previousTeams?: Team[] }
  >({
    mutationFn: updateTeam,
    onMutate: async (updatedTeamData) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previousTeams = queryClient.getQueryData<Team[]>(["teams"]);

      // Optimistic update
      queryClient.setQueryData<Team[]>(["teams"], (old) =>
        old
          ? old.map((team) =>
              team.id === updatedTeamData.id
                ? {
                    ...team,
                    name: updatedTeamData.name,
                    description: updatedTeamData.description,
                    leader_id: updatedTeamData.leader_id,
                    branch: updatedTeamData.branch,
                    updated_at: new Date().toISOString(),
                  }
                : team
            )
          : []
      );

      return { previousTeams };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team updated successfully!");
      } else {
        toast.error(result.error || "Failed to update team.");
      }
    },
    onError: (err, updatedTeamData, context) => {
      toast.error(err.message || "Failed to update team.");
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // Mutation for deleting a team
  const deleteMutation = useMutation<
    { success: boolean; error?: string },
    Error,
    string,
    { previousTeams?: Team[] }
  >({
    mutationFn: deleteTeam,
    onMutate: async (teamId) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previousTeams = queryClient.getQueryData<Team[]>(["teams"]);

      // Optimistic update
      queryClient.setQueryData<Team[]>(["teams"], (old) =>
        old ? old.filter((team) => team.id !== teamId) : []
      );

      return { previousTeams };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete team.");
      }
    },
    onError: (err, teamId, context) => {
      toast.error(err.message || "Failed to delete team.");
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  return {
    teams: teams || [],
    isLoading,
    error,
    createTeam: createMutation.mutate,
    updateTeam: updateMutation.mutate,
    deleteTeam: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

