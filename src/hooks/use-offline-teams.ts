"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offlineDB, OfflineTeam, OfflineTeamMember } from "@/lib/offline/database";
import { syncService } from "@/lib/offline/sync-service";
import { createClient } from "@/lib/supabase/client";
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
      console.log('🔄 Real-time update detected - refreshing teams data');
      queryClient.invalidateQueries({ queryKey: ['offline-teams'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    return () => window.removeEventListener('dataUpdated', handleDataUpdate);
  }, [queryClient]);

  // Query to fetch all teams (offline-first)
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery<OfflineTeam[], Error>({
    queryKey: ["offline-teams"],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
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
    enabled: typeof window !== 'undefined', // Only run on client-side
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
        if (syncStatus.isOnline) {
          // ONLINE: Create directly in Supabase first
          console.log('Online mode: Creating team in Supabase...');
          const supabase = createClient();
          
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('teams')
            .insert({
              name: newTeam.name,
              description: newTeam.description,
              leader_id: newTeam.leader_id,
              branch: newTeam.branch,
            })
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase create failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Team created successfully in Supabase:', supabaseData);
          
          // Also add to IndexedDB for immediate UI update
          const teamData: OfflineTeam = {
            id: supabaseData.id,
            name: supabaseData.name,
            description: supabaseData.description,
            leader_id: supabaseData.leader_id,
            branch: supabaseData.branch,
            members: [],
            created_at: supabaseData.created_at,
            updated_at: supabaseData.updated_at,
            _isOffline: false,
            _lastSync: Date.now(),
          };
          
          await offlineDB.teams.put(teamData);
          console.log('Team also added to IndexedDB for UI update');
          
          // Add team members to Supabase
          if (newTeam.member_ids && newTeam.member_ids.length > 0) {
            const membersToInsert = newTeam.member_ids.map(memberId => ({
              team_id: supabaseData.id,
              staff_id: memberId,
              joined_at: new Date().toISOString(),
            }));
            
            const { error: membersError } = await supabase
              .from('team_members')
              .insert(membersToInsert);
            
            if (membersError) {
              console.error('Failed to add team members:', membersError);
            } else {
              // Add members to IndexedDB too
              for (const memberId of newTeam.member_ids) {
                const memberData: OfflineTeamMember = {
                  id: `member_${supabaseData.id}_${memberId}`,
                  team_id: supabaseData.id,
                  staff_id: memberId,
                  joined_at: new Date().toISOString(),
                  _isOffline: false,
                  _lastSync: Date.now(),
                };
                
                await offlineDB.teamMembers.put(memberData);
              }
            }
          }

          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: teamData
          };
        } else {
          // OFFLINE: Local storage only
          console.log('Offline mode: Storing team locally...');
          
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

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: teamData };
        }
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

        if (syncStatus.isOnline && !existingTeam._isOffline) {
          // ONLINE: Update directly in Supabase
          console.log('Online mode: Updating team in Supabase...');
          const supabase = createClient();
          
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('teams')
            .update({
              name: updateData.name,
              description: updateData.description,
              leader_id: updateData.leader_id,
              branch: updateData.branch,
            })
            .eq('id', updateData.id)
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase update failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Team updated successfully in Supabase:', supabaseData);
          
          // Also update in IndexedDB for immediate UI update
          const teamData: OfflineTeam = {
            id: supabaseData.id,
            name: supabaseData.name,
            description: supabaseData.description,
            leader_id: supabaseData.leader_id,
            branch: supabaseData.branch,
            members: [],
            created_at: supabaseData.created_at,
            updated_at: supabaseData.updated_at,
            _isOffline: false,
            _lastSync: Date.now(),
          };
          
          await offlineDB.teams.put(teamData);
          console.log('Team also updated in IndexedDB for UI update');
          
          // Update team members in Supabase
          // Remove existing members
          await supabase
            .from('team_members')
            .delete()
            .eq('team_id', updateData.id);
          
          // Add new members
          if (updateData.member_ids && updateData.member_ids.length > 0) {
            const membersToInsert = updateData.member_ids.map(memberId => ({
              team_id: updateData.id,
              staff_id: memberId,
              joined_at: new Date().toISOString(),
            }));
            
            await supabase
              .from('team_members')
              .insert(membersToInsert);
            
            // Update members in IndexedDB too
            await offlineDB.teamMembers.where('team_id').equals(updateData.id).delete();
            
            for (const memberId of updateData.member_ids) {
              const memberData: OfflineTeamMember = {
                id: `member_${updateData.id}_${memberId}`,
                team_id: updateData.id,
                staff_id: memberId,
                joined_at: new Date().toISOString(),
                _isOffline: false,
                _lastSync: Date.now(),
              };
              
              await offlineDB.teamMembers.put(memberData);
            }
          }

          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: teamData
          };
        } else {
          // OFFLINE: Update locally only
          console.log('Offline mode: Updating team locally...');
          
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

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: { ...existingTeam, ...updatedTeam } };
        }
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
        const existingTeam = await offlineDB.teams.get(teamId);
        if (!existingTeam) {
          throw new Error("Team not found");
        }

        if (syncStatus.isOnline && !existingTeam._isOffline) {
          // ONLINE: Delete directly from Supabase
          console.log('Online mode: Deleting team from Supabase...');
          const supabase = createClient();
          
          // Delete team members first
          await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId);
          
          // Delete team
          const { error: supabaseError } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

          if (supabaseError) {
            console.error('Supabase delete failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Team deleted successfully from Supabase');
          
          // Also delete from IndexedDB for immediate UI update
          await offlineDB.teamMembers.where('team_id').equals(teamId).delete();
          await offlineDB.teams.delete(teamId);
          console.log('Team also deleted from IndexedDB for UI update');
          
          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true };
        } else {
          // OFFLINE: Delete locally only
          console.log('Offline mode: Deleting team locally...');
          
          // Delete team members first
          await offlineDB.teamMembers.where('team_id').equals(teamId).delete();
          
          // Delete team
          await offlineDB.teams.delete(teamId);

          // Queue for sync
          await syncService.queueOperation('teams', 'delete', { id: teamId });

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-teams"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true };
        }
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
