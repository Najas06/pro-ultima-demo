'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Real-time Data Synchronization Component
 * Ensures all admin data stays in sync across:
 * 1. Different devices and machines (via Supabase Realtime)
 * 2. Multiple browser tabs on same machine (via Custom Events + LocalStorage)
 * 3. Same tab refreshes (via React Query invalidation)
 */
export function RealtimeDataSync() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    console.log('🔄 Real-time sync initialized for admin portal');

    // Invalidate all relevant queries on update
    const handleUpdate = () => {
      console.log('🔄 Data update detected - refreshing queries');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    };

    // 1. Supabase Realtime (cross-device, cross-browser, different machines)
    const tasksChannel = supabase
      .channel('admin-tasks-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('📡 Supabase: Tasks table changed', payload.eventType);
          handleUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments' },
        (payload) => {
          console.log('📡 Supabase: Task assignments changed', payload.eventType);
          handleUpdate();
        }
      )
      .subscribe();

    const staffChannel = supabase
      .channel('admin-staff-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          console.log('📡 Supabase: Staff table changed', payload.eventType);
          handleUpdate();
        }
      )
      .subscribe();

    const teamsChannel = supabase
      .channel('admin-teams-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('📡 Supabase: Teams table changed', payload.eventType);
          handleUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('📡 Supabase: Team members changed', payload.eventType);
          handleUpdate();
        }
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('admin-attendance-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('📡 Supabase: Attendance changed', payload.eventType);
          handleUpdate();
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
        }
      )
      .subscribe();

    const delegationsChannel = supabase
      .channel('admin-delegations-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_delegations' },
        (payload) => {
          console.log('📡 Supabase: Task delegation changed', payload.eventType);
          handleUpdate();
          queryClient.invalidateQueries({ queryKey: ['task-delegations'] });
        }
      )
      .subscribe();

    // 2. Custom Event Listener (same browser, multiple tabs - primary method)
    const handleCustomUpdate = (e: Event) => {
      console.log('📲 Cross-tab update via custom event');
      handleUpdate();
    };
    window.addEventListener('dataUpdated', handleCustomUpdate);

    // 3. LocalStorage Event (same browser, multiple tabs - fallback method)
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'data-sync-trigger') {
        console.log('📲 Cross-tab update via storage event');
        handleUpdate();
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    // Cleanup
    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(delegationsChannel);
      window.removeEventListener('dataUpdated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [queryClient, supabase]);

  // This component doesn't render anything, it just handles real-time updates
  return null;
}

