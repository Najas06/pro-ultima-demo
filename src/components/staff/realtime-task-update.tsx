'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function RealtimeTaskUpdate() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for real-time updates from other devices/browsers
    const handleDataUpdate = () => {
      console.log('Real-time update detected, refreshing task data...');
      
      // Invalidate and refetch task queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    // Listen for custom data update events
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', handleDataUpdate);

    // Listen for Supabase real-time updates
    const supabase = createClient();
    const subscription = supabase
        .channel('tasks-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('Real-time task update received:', payload);
            handleDataUpdate();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'task_assignments' },
          (payload) => {
            console.log('Real-time task assignment update received:', payload);
            handleDataUpdate();
          }
        )
        .subscribe();

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  // This component doesn't render anything, it just handles real-time updates
  return null;
}
