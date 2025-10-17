'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { PurchaseRequisition, PurchaseRequisitionFormData } from '@/types/maintenance';

export function usePurchaseRequisitions(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch purchase requisitions (all or filtered by staff_id)
  const { data: requisitions = [], isLoading, error, refetch } = useQuery<PurchaseRequisition[]>({
    queryKey: ['purchase-requisitions', staffId],
    queryFn: async () => {
      let query = supabase
        .from('purchase_requisitions')
        .select(`
          *,
          staff:staff_id(name, employee_id, email),
          admin:approved_by(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (staffId) {
        query = query.eq('staff_id', staffId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Real-time subscription for purchase requisitions
  useEffect(() => {
    const channel = supabase
      .channel('purchase-requisitions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_requisitions' },
        (payload) => {
          console.log('📡 Purchase requisition changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected: purchase_requisitions');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: purchase_requisitions');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  // Create requisition
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseRequisitionFormData & { staff_id: string }) => {
      const { data: result, error } = await supabase
        .from('purchase_requisitions')
        .insert(data)
        .select(`
          *,
          staff:staff_id(name, employee_id, email)
        `)
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: async (data) => {
      toast.success('Purchase requisition submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      
      // Send email notification to admin
      try {
        await fetch('/api/email/send-purchase-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'submission',
            adminEmail: 'admin@proultima.com',
            staffName: data.name,
            staffEmail: Array.isArray(data.staff) ? data.staff[0]?.email : data.staff?.email || '',
            purchaseItem: data.purchase_item,
            branch: data.branch,
            requestDate: data.requested_date,
          }),
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit requisition: ' + (error as Error).message);
    },
  });

  // Approve requisition
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminId, notes, requisition }: { id: string; adminId: string; notes?: string; requisition: PurchaseRequisition }) => {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      return requisition;
    },
    onSuccess: async (requisition) => {
      toast.success('Purchase requisition approved!');
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      
      // Send email notification to staff
      try {
        const staffEmail = Array.isArray(requisition.staff) ? requisition.staff[0]?.email : requisition.staff?.email;
        if (staffEmail) {
          await fetch('/api/email/send-purchase-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'status_update',
              staffEmail,
              staffName: requisition.name,
              purchaseItem: requisition.purchase_item,
              status: 'approved',
              adminNotes: requisition.admin_notes,
            }),
          });
        }
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to approve requisition: ' + (error as Error).message);
    },
  });

  // Reject requisition
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminId, reason, requisition }: { id: string; adminId: string; reason: string; requisition: PurchaseRequisition }) => {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      return requisition;
    },
    onSuccess: async (requisition) => {
      toast.success('Purchase requisition rejected');
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      
      // Send email notification to staff
      try {
        const staffEmail = Array.isArray(requisition.staff) ? requisition.staff[0]?.email : requisition.staff?.email;
        if (staffEmail) {
          await fetch('/api/email/send-purchase-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'status_update',
              staffEmail,
              staffName: requisition.name,
              purchaseItem: requisition.purchase_item,
              status: 'rejected',
              rejectionReason: requisition.rejection_reason,
            }),
          });
        }
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to reject requisition: ' + (error as Error).message);
    },
  });

  return {
    requisitions,
    isLoading,
    error,
    refetch,
    createRequisition: createMutation.mutate,
    approveRequisition: approveMutation.mutate,
    rejectRequisition: rejectMutation.mutate,
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

