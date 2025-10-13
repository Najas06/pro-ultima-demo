'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Attendance, AttendanceRecord, AttendanceSummary } from '@/types/attendance';

export function useAttendance() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Mark login
  const markLoginMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const today = getTodayDate();

      // Check if already logged in today
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .single();

      if (existing) {
        // Already logged in today, don't create duplicate
        return { success: true, data: existing, isNewLogin: false };
      }

      // Create new attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          staff_id: staffId,
          login_time: new Date().toISOString(),
          date: today,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, isNewLogin: true };
    },
    onSuccess: (result) => {
      if (result.isNewLogin) {
        toast.success('Login time recorded');
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error) => {
      console.error('Error marking login:', error);
      toast.error('Failed to record login time');
    },
  });

  // Mark logout
  const markLogoutMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const today = getTodayDate();

      const { data, error } = await supabase
        .from('attendance')
        .update({
          logout_time: new Date().toISOString(),
          status: 'logged_out',
        })
        .eq('staff_id', staffId)
        .eq('date', today)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      toast.success('Logout time recorded');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error) => {
      console.error('Error marking logout:', error);
      toast.error('Failed to record logout time');
    },
  });

  // Get today's attendance for a specific staff
  const useTodayAttendance = (staffId: string | undefined) => {
    return useQuery<Attendance | null>({
      queryKey: ['attendance', 'today', staffId],
      queryFn: async () => {
        if (!staffId) return null;

        const today = getTodayDate();
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('staff_id', staffId)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected
          throw error;
        }

        return data as Attendance | null;
      },
      enabled: !!staffId,
    });
  };

  // Get all today's attendance records
  const useTodayAllAttendance = () => {
    return useQuery<AttendanceRecord[]>({
      queryKey: ['attendance', 'today', 'all'],
      queryFn: async () => {
        const today = getTodayDate();
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            *,
            staff:staff_id (
              id,
              name,
              email,
              role,
              department,
              profile_image_url
            )
          `)
          .eq('date', today)
          .order('login_time', { ascending: false });

        if (error) throw error;

        return data as AttendanceRecord[];
      },
    });
  };

  // Get attendance summary
  const useAttendanceSummary = () => {
    return useQuery<AttendanceSummary>({
      queryKey: ['attendance-summary'],
      queryFn: async () => {
        const today = getTodayDate();

        // Get total staff count
        const { count: totalStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get present count
        const { count: present } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);

        // Get logged out count
        const { count: loggedOut } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'logged_out');

        return {
          totalStaff: totalStaff || 0,
          present: present || 0,
          absent: (totalStaff || 0) - (present || 0),
          loggedOut: loggedOut || 0,
        };
      },
    });
  };

  // Get attendance history for a staff member
  const useAttendanceHistory = (staffId: string | undefined, days: number = 30) => {
    return useQuery<Attendance[]>({
      queryKey: ['attendance', 'history', staffId, days],
      queryFn: async () => {
        if (!staffId) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error} = await supabase
          .from('attendance')
          .select('*')
          .eq('staff_id', staffId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;

        return data as Attendance[];
      },
      enabled: !!staffId,
    });
  };

  // Real-time subscription for attendance
  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('📡 Attendance changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
        }
      )
      .subscribe();

    const handleDataUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [queryClient, supabase]);

  return {
    markLogin: markLoginMutation.mutate,
    markLogout: markLogoutMutation.mutate,
    isMarkingLogin: markLoginMutation.isPending,
    isMarkingLogout: markLogoutMutation.isPending,
    useTodayAttendance,
    useTodayAllAttendance,
    useAttendanceSummary,
    useAttendanceHistory,
  };
}

