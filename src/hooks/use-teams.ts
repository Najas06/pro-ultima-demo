'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  staff_id: string;
  joined_at: string;
}

interface TeamFormData {
  name: string;
  description?: string;
  leader_id: string;
  branch?: string;
  member_ids?: string[];
}

export function useTeams() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all teams
  const { data: teams = [], isLoading, error, refetch } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant refetches
    refetchOnWindowFocus: true,
    refetchInterval: 1000, // Poll every second as fallback
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*');

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant refetches
  });

  // Real-time subscription
  useEffect(() => {
    const teamsChannel = supabase
      .channel('teams-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('📡 Teams table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['teams'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
          localStorage.setItem('data-sync-trigger', Date.now().toString());
        }
      )
      .subscribe();

    const membersChannel = supabase
      .channel('team-members-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('📡 Team members table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
          queryClient.invalidateQueries({ queryKey: ['teams'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
          localStorage.setItem('data-sync-trigger', Date.now().toString());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [queryClient, supabase]);

  // Create team mutation
  const createMutation = useMutation({
    mutationFn: async (formData: TeamFormData) => {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name,
          description: formData.description,
          leader_id: formData.leader_id,
          branch: formData.branch,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      if (formData.member_ids && formData.member_ids.length > 0) {
        const members = formData.member_ids.map((staff_id) => ({
          team_id: team.id,
          staff_id,
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(members);

        if (membersError) throw membersError;
      }

      return team;
    },
    onSuccess: () => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to create team: ' + (error as Error).message);
    },
  });

  // Update team mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, member_ids, ...updates }: Partial<Team> & { id: string; member_ids?: string[] }) => {
      // Update team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (teamError) throw teamError;

      // Update members if provided
      if (member_ids !== undefined) {
        // Delete existing members
        await supabase.from('team_members').delete().eq('team_id', id);

        // Add new members
        if (member_ids.length > 0) {
          const members = member_ids.map((staff_id) => ({
            team_id: id,
            staff_id,
          }));

          const { error: membersError } = await supabase
            .from('team_members')
            .insert(members);

          if (membersError) throw membersError;
        }
      }

      return team;
    },
    onSuccess: () => {
      toast.success('Team updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update team: ' + (error as Error).message);
    },
  });

  // Delete team mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Team deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to delete team: ' + (error as Error).message);
    },
  });

  return {
    teams,
    teamMembers,
    isLoading,
    error,
    refetch,
    createTeam: createMutation.mutate,
    updateTeam: updateMutation.mutate,
    deleteTeam: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
