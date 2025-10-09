"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offlineDB, OfflineTeam, OfflineTeamMember } from "@/lib/offline/database";
import { syncService } from "@/lib/offline/sync-service";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Transform offline team to match the expected Team interface
const transformOfflineTeam = (team: OfflineTeam) => ({
  id: team.id,
  name: team.name,
  description: team.description,
  leader_id: team.leader_id,
  leader: team.leader,
  branch: team.branch,
  members: team.members,
  created_at: team.created_at,
  updated_at: team.updated_at,
});

export function useOfflineTeams() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Query to fetch all teams (offline-first)
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery<OfflineTeam[], Error>({
    queryKey: ["offline-teams"],
    queryFn: async () => {
      const teamsData = await offlineDB.teams.orderBy('created_at').reverse().toArray();
      
      // Load leader and team members for each team
      for (const team of teamsData) {
        // Load leader data
        if (team.leader_id) {
          const leader = await offlineDB.staff.get(team.leader_id);
          if (leader) {
            team.leader = leader;
          }
        }
        
        // Load team members
        const members = await offlineDB.teamMembers
          .where('team_id')
          .equals(team.id)
          .toArray();
        
        // Load staff data for each member
        for (const member of members) {
          const staff = await offlineDB.staff.get(member.staff_id);
          if (staff) {
            member.staff = staff;
          }
        }
        
        team.members = members;
      }
      
      return teamsData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Create team mutation
  const createMutation = useMutation<
    { success: boolean; data?: OfflineTeam; error?: string },
    Error,
    {
      name: string;
      description?: string;
      leader_id: string;
      branch?: string;
      member_ids: string[];
    }
  >({
    mutationFn: async (newTeam) => {
      try {
        // Generate offline ID
        const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const teamData: OfflineTeam = {
          id: offlineId,
          name: newTeam.name,
          description: newTeam.description,
          leader_id: newTeam.leader_id,
          branch: newTeam.branch,
          members: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _isOffline: true,
          _lastSync: Date.now(),
        };

        // Add team to offline database
        await offlineDB.teams.add(teamData);

        // Add team members
        for (const memberId of newTeam.member_ids) {
          const memberData: OfflineTeamMember = {
            id: `offline_member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            team_id: offlineId,
            staff_id: memberId,
            joined_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };
          
          await offlineDB.teamMembers.add(memberData);
        }

        // Queue for sync
        await syncService.queueOperation('teams', 'create', {
          name: newTeam.name,
          description: newTeam.description,
          leader_id: newTeam.leader_id,
          branch: newTeam.branch,
        });

        // Queue team members for sync
        for (const memberId of newTeam.member_ids) {
          await syncService.queueOperation('team_members', 'create', {
            team_id: offlineId,
            staff_id: memberId,
            joined_at: new Date().toISOString(),
          });
        }

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-teams"] });

        return { success: true, data: teamData };
      } catch (error) {
        console.error("Error creating team:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to create team" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team created successfully!");
      } else {
        toast.error(result.error || "Failed to create team.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create team.");
    },
  });

  // Update team mutation
  const updateMutation = useMutation<
    { success: boolean; data?: OfflineTeam; error?: string },
    Error,
    {
      id: string;
      name: string;
      description?: string;
      leader_id: string;
      branch?: string;
      member_ids: string[];
    }
  >({
    mutationFn: async (updateData) => {
      try {
        const existingTeam = await offlineDB.teams.get(updateData.id);
        if (!existingTeam) {
          throw new Error("Team not found");
        }

        const updatedTeam: Partial<OfflineTeam> = {
          name: updateData.name,
          description: updateData.description,
          leader_id: updateData.leader_id,
          branch: updateData.branch,
          updated_at: new Date().toISOString(),
          _isOffline: true,
          _lastSync: Date.now(),
        };

        // Update team in offline database
        await offlineDB.teams.update(updateData.id, updatedTeam);

        // Update team members
        // Remove existing members
        await offlineDB.teamMembers.where('team_id').equals(updateData.id).delete();
        
        // Add new members
        for (const memberId of updateData.member_ids) {
          const memberData: OfflineTeamMember = {
            id: `offline_member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            team_id: updateData.id,
            staff_id: memberId,
            joined_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };
          
          await offlineDB.teamMembers.add(memberData);
        }

        // Queue for sync
        await syncService.queueOperation('teams', 'update', {
          id: updateData.id,
          name: updateData.name,
          description: updateData.description,
          leader_id: updateData.leader_id,
          branch: updateData.branch,
        });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-teams"] });

        return { success: true, data: { ...existingTeam, ...updatedTeam } };
      } catch (error) {
        console.error("Error updating team:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to update team" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team updated successfully!");
      } else {
        toast.error(result.error || "Failed to update team.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update team.");
    },
  });

  // Delete team mutation
  const deleteMutation = useMutation<
    { success: boolean; error?: string },
    Error,
    string
  >({
    mutationFn: async (teamId) => {
      try {
        // Delete team members first
        await offlineDB.teamMembers.where('team_id').equals(teamId).delete();
        
        // Delete team
        await offlineDB.teams.delete(teamId);

        // Queue for sync
        await syncService.queueOperation('teams', 'delete', { id: teamId });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-teams"] });

        return { success: true };
      } catch (error) {
        console.error("Error deleting team:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to delete team" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Team deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete team.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete team.");
    },
  });

  return {
    // Data
    teams: teams?.map(transformOfflineTeam) || [],
    isLoading,
    error,
    
    // Sync status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingOperations: syncStatus.pendingOperations,
    
    // Mutations
    createTeam: createMutation.mutate,
    updateTeam: updateMutation.mutate,
    deleteTeam: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    downloadData: syncService.downloadData.bind(syncService),
    syncAll: syncService.syncAll.bind(syncService),
  };
}
