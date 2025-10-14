'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { debounce } from '@/lib/debounce';
import type { MaintenanceRequest, MaintenanceFormData, MaintenanceStatus } from '@/types/maintenance';

export function useMaintenanceRequests(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch maintenance requests
  const { data: requests = [], isLoading, error, refetch } = useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance-requests', staffId],
    queryFn: async () => {
      console.log('🔍 Fetching maintenance requests...', { staffId });
      
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          ),
          approver:approved_by (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      console.log('📊 Maintenance requests fetched:', {
        count: data?.length || 0,
        data: data?.map(r => ({ id: r.id, status: r.status, branch: r.branch })),
        error
      });

      if (error) {
        console.error('❌ Error fetching maintenance requests:', error);
        throw error;
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Get pending count for admin
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['maintenance-requests-pending-count'],
    queryFn: async () => {
      console.log('🔍 Fetching pending count...');
      
      const { count, error } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      console.log('📊 Pending count:', { count, error });

      if (error) {
        console.error('❌ Error fetching pending count:', error);
        throw error;
      }
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
  });

  // Debounced invalidation to prevent excessive refetches
  const debouncedInvalidate = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      }, 300), // Reduced to 300ms for faster updates
    [queryClient]
  );

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        (payload) => {
          console.log('📡 Maintenance request changed:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          });
          debouncedInvalidate(); // Use debounced version
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected: maintenance_requests');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: maintenance_requests');
        }
      });

    return () => {
      debouncedInvalidate.cancel(); // Cancel pending debounces
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, debouncedInvalidate]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'maintenance-sync-trigger') {
        console.log('🔄 Cross-tab sync: maintenance_requests');
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      console.log('🔄 Custom event sync: maintenance_requests', e.detail);
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('maintenanceRequestCreated', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('maintenanceRequestCreated', handleCustomEvent as EventListener);
    };
  }, [queryClient]);

  // Create maintenance request mutation
  const createMutation = useMutation({
    mutationFn: async (formData: MaintenanceFormData & { staff_id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...formData,
          status: 'pending',
          requested_date: new Date().toISOString(),
        })
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Maintenance request submitted successfully!');
      
      // Immediate invalidation for instant feedback
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      
      // Broadcast to other tabs/windows
      window.dispatchEvent(new CustomEvent('maintenanceRequestCreated', { detail: data }));
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('maintenance-sync-trigger', Date.now().toString());

      // Send email notification to admin
      try {
        await fetch('/api/email/send-maintenance-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_request',
            requestData: data,
            adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@company.com',
          }),
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + (error as Error).message);
    },
  });

  // Update maintenance request mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<MaintenanceFormData> }) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Request updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to update request: ' + (error as Error).message);
    },
  });

  // Approve request mutation (admin only)
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminId, notes }: { id: string; adminId: string; notes?: string }) => {
      console.log('🔍 Approving maintenance request...', { requestId: id, adminId });
      
      // Get current admin user from localStorage (custom auth)
      const authUserJson = localStorage.getItem('auth_user');
      if (!authUserJson) {
        throw new Error('Admin not authenticated');
      }
      
      const authUser = JSON.parse(authUserJson);
      console.log('✅ Found admin user:', { id: authUser.id, role: authUser.role });
      
      if (authUser.role !== 'admin') {
        throw new Error('Only admin can approve requests');
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'approved',
          approved_by: authUser.id, // Use admin ID from localStorage
          approved_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error approving request:', error);
        throw error;
      }
      
      console.log('✅ Request approved successfully');
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Request approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to staff
      if (data.staff?.email) {
        try {
          await fetch('/api/email/send-maintenance-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'approved',
              requestData: data,
              staffEmail: data.staff.email,
              adminNotes: data.admin_notes,
            }),
          });
        } catch (error) {
          console.error('Failed to send approval email:', error);
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to approve request: ' + (error as Error).message);
    },
  });

  // Reject request mutation (admin only)
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminId, reason }: { id: string; adminId: string; reason: string }) => {
      console.log('🔍 Rejecting maintenance request...', { requestId: id, adminId });
      
      // Get current admin user from localStorage (custom auth)
      const authUserJson = localStorage.getItem('auth_user');
      if (!authUserJson) {
        throw new Error('Admin not authenticated');
      }
      
      const authUser = JSON.parse(authUserJson);
      console.log('✅ Found admin user:', { id: authUser.id, role: authUser.role });
      
      if (authUser.role !== 'admin') {
        throw new Error('Only admin can reject requests');
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'rejected',
          approved_by: authUser.id, // Use admin ID from localStorage
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error rejecting request:', error);
        throw error;
      }
      
      console.log('✅ Request rejected successfully');
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Request rejected.');
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to staff
      if (data.staff?.email) {
        try {
          await fetch('/api/email/send-maintenance-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'rejected',
              requestData: data,
              staffEmail: data.staff.email,
              rejectionReason: data.rejection_reason,
            }),
          });
        } catch (error) {
          console.error('Failed to send rejection email:', error);
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to reject request: ' + (error as Error).message);
    },
  });

  return {
    requests,
    pendingCount,
    isLoading,
    error,
    refetch,
    createRequest: createMutation.mutate,
    updateRequest: updateMutation.mutate,
    approveRequest: approveMutation.mutate,
    rejectRequest: rejectMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
