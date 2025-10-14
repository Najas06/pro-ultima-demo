'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { debounce } from '@/lib/debounce';
import type { TaskUpdateProof } from '@/types/cashbook';

export function useTaskProofs(taskId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch task proofs
  const { data: proofs = [], isLoading, error, refetch } = useQuery<TaskUpdateProof[]>({
    queryKey: ['task-proofs', taskId],
    queryFn: async () => {
      let query = supabase
        .from('task_update_proofs')
        .select(`
          *,
          staff:staff_id (
            name,
            employee_id
          ),
          admin:verified_by (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Get pending verifications count
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['task-proofs-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('task_update_proofs')
        .select('*', { count: 'exact', head: true })
        .is('is_verified', null);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
  });

  // Debounced invalidation to prevent excessive refetches
  const debouncedInvalidate = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
        queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      }, 300), // Reduced to 300ms for faster updates
    [queryClient]
  );

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('task-proofs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_update_proofs' },
        (payload) => {
          console.log('📡 Task proof changed:', payload);
          debouncedInvalidate(); // Use debounced version
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected: task_update_proofs');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: task_update_proofs');
        }
      });

    return () => {
      debouncedInvalidate.cancel(); // Cancel pending debounces
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, debouncedInvalidate]);

  // Create task proof mutation
  const createMutation = useMutation({
    mutationFn: async (formData: {
      task_id: string;
      staff_id: string;
      status: string;
      proof_image_url: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_update_proofs')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Proof uploaded successfully! Awaiting admin verification.');
      queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to upload proof: ' + (error as Error).message);
    },
  });

  // Verify proof mutation (admin only)
  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      is_verified,
      verified_by,
      verification_notes,
    }: {
      id: string;
      is_verified: boolean;
      verified_by: string;
      verification_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_update_proofs')
        .update({
          is_verified,
          verified_by,
          verified_at: new Date().toISOString(),
          verification_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      const status = result.is_verified ? 'verified' : 'rejected';
      toast.success(`Proof ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to verify proof: ' + (error as Error).message);
    },
  });

  // Upload image to Supabase Storage
  const uploadProofImage = async (file: File, taskId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('task-proofs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Upload receipt image to Supabase Storage
  const uploadReceiptImage = async (file: File, voucherNo: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${voucherNo}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cash-receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('cash-receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    proofs,
    pendingCount,
    isLoading,
    error,
    refetch,
    createProof: createMutation.mutate,
    verifyProof: verifyMutation.mutate,
    uploadProofImage,
    uploadReceiptImage,
    isCreatingProof: createMutation.isPending,
    isVerifying: verifyMutation.isPending,
  };
}



