'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { hashPassword } from '@/lib/auth';

interface Staff {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffFormData {
  name: string;
  email: string;
  employee_id: string;
  password: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage?: string;
}

interface StaffUpdateData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage?: string;
  oldProfileImageUrl?: string;
  password?: string;
}

export function useStaff() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all staff
  const { data: staff = [], isLoading, error, refetch } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant refetches
    refetchOnWindowFocus: true,
    refetchInterval: 1000, // Poll every second as fallback
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('staff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          console.log('📡 Staff table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['staff'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
          localStorage.setItem('data-sync-trigger', Date.now().toString());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: async (formData: StaffFormData) => {
      // Hash password
      const password_hash = await hashPassword(formData.password);

      const { data, error } = await supabase
        .from('staff')
        .insert({
          name: formData.name,
          email: formData.email,
          employee_id: formData.employee_id,
          password_hash,
          role: formData.role,
          department: formData.department,
          branch: formData.branch,
          phone: formData.phone,
          profile_image_url: formData.profileImage || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Staff member created successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to create staff: ' + (error as Error).message);
    },
  });

  // Update staff mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: StaffUpdateData) => {
      const updateFields: Record<string, unknown> = {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        department: updateData.department,
        branch: updateData.branch,
        phone: updateData.phone,
        profile_image_url: updateData.profileImage || null,
        updated_at: new Date().toISOString(),
      };

      // Add password hash if password is provided
      if (updateData.password && updateData.password.trim() !== '') {
        updateFields.password_hash = await hashPassword(updateData.password);
      }

      const { data, error } = await supabase
        .from('staff')
        .update(updateFields)
        .eq('id', updateData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Staff member updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update staff: ' + (error as Error).message);
    },
  });

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Staff member deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to delete staff: ' + (error as Error).message);
    },
  });

  return {
    staff,
    isLoading,
    error,
    refetch,
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
