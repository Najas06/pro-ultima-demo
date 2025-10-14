'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { hashPassword } from '@/lib/auth';
import { debounce } from '@/lib/debounce';

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
    staleTime: 5 * 60 * 1000, // 5 minutes - data fresh for 5 min
    refetchOnWindowFocus: false, // Disable - we have real-time
    // Removed refetchInterval - real-time subscriptions handle updates
  });

  // Debounced invalidation to prevent excessive refetches
  const debouncedInvalidate = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        window.dispatchEvent(new CustomEvent('dataUpdated'));
        localStorage.setItem('data-sync-trigger', Date.now().toString());
      }, 300), // Reduced to 300ms for faster updates
    [queryClient]
  );

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('staff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          console.log('📡 Staff table changed:', payload);
          debouncedInvalidate(); // Use debounced version
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected: staff');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: staff');
        }
      });

    return () => {
      debouncedInvalidate.cancel(); // Cancel pending debounces
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, debouncedInvalidate]);

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
        console.log('🔑 Updating staff password...', { staffId: updateData.id });
        const password_hash = await hashPassword(updateData.password);
        updateFields.password_hash = password_hash;

        // Get staff's auth_user_id
        const { data: staff } = await supabase
          .from('staff')
          .select('auth_user_id')
          .eq('id', updateData.id)
          .single();

        // Update Supabase Auth password if auth_user_id exists
        if (staff?.auth_user_id) {
          console.log('🔑 Updating Supabase Auth password...', { authUserId: staff.auth_user_id });
          const { error: authError } = await supabase.auth.admin.updateUserById(
            staff.auth_user_id,
            {
              password: updateData.password,
            }
          );

          if (authError) {
            console.error('❌ Error updating Supabase Auth password:', authError);
            throw new Error(`Failed to update Supabase Auth password: ${authError.message}`);
          }
          console.log('✅ Supabase Auth password updated successfully');
        } else {
          console.warn('⚠️ Staff has no auth_user_id, skipping Supabase Auth password update');
        }
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
