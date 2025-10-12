"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offlineDB, OfflineStaff } from "@/lib/offline/database";
import { syncService } from "@/lib/offline/sync-service";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Transform offline staff to match the expected Staff interface
const transformOfflineStaff = (staff: OfflineStaff) => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  role: staff.role,
  department: staff.department,
  branch: staff.branch,
  phone: staff.phone,
  profile_image_url: staff.profile_image_url,
  created_at: staff.created_at,
  updated_at: staff.updated_at,
});

export function useOfflineStaff() {
  const queryClient = useQueryClient();
  const supabase = createClient();
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
      console.log('🔄 Real-time update detected - refreshing staff data');
      queryClient.invalidateQueries({ queryKey: ['offline-staff'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    return () => window.removeEventListener('dataUpdated', handleDataUpdate);
  }, [queryClient]);

  // Simple refresh function for instant UI updates
  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Query to fetch all staff (offline-first)
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery<OfflineStaff[], Error>({
    queryKey: ["offline-staff"],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
      
      console.log('🔍 Fetching staff data from IndexedDB...');
      const staffData = await offlineDB.staff.orderBy('created_at').reverse().toArray();
      console.log('📋 Staff data from IndexedDB:', staffData.length, 'staff members');
      
      // If no staff data in IndexedDB, try to sync from Supabase
      if (staffData.length === 0 && syncStatus.isOnline) {
        console.log('🔄 No staff data in IndexedDB, syncing from Supabase...');
        try {
          // Try to sync staff data from Supabase
          await syncService.syncAll();
          const refreshedStaffData = await offlineDB.staff.orderBy('created_at').reverse().toArray();
          console.log('📋 Staff data after sync:', refreshedStaffData.length, 'staff members');
          return refreshedStaffData;
        } catch (syncError) {
          console.error('❌ Error syncing staff data:', syncError);
          // If sync fails, try direct Supabase query as fallback
          try {
            console.log('🔄 Fallback: Direct Supabase query for staff data...');
            const { data: supabaseStaff, error } = await supabase
              .from('staff')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) {
              console.error('❌ Supabase staff query error:', error);
            } else if (supabaseStaff && supabaseStaff.length > 0) {
              console.log('📋 Direct Supabase staff data:', supabaseStaff.length, 'staff members');
              // Store in IndexedDB for future use
              await offlineDB.staff.bulkPut(supabaseStaff.map(staff => ({
                ...staff,
                _isOffline: false,
                _lastSync: Date.now()
              })));
              return supabaseStaff;
            }
          } catch (fallbackError) {
            console.error('❌ Fallback staff query error:', fallbackError);
          }
        }
      }
      
      return staffData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: typeof window !== 'undefined', // Only run on client-side
  });

  // Create staff mutation
  const createMutation = useMutation<
    { success: boolean; data?: OfflineStaff; error?: string },
    Error,
    {
      name: string;
      employee_id: string;
      email: string;
      password: string;
      role: string;
      department: string;
      branch?: string;
      phone?: string;
      profileImage?: string;
    }
  >({
    mutationFn: async (newStaff) => {
      try {
        // CLEAN HYBRID FLOW: Online = Supabase only, Offline = Local only
        if (syncStatus.isOnline) {
          // ONLINE: Direct Supabase operation, no local storage
          console.log('Online mode: Creating staff directly in Supabase...');
          const supabase = createClient();
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('staff')
            .insert({
              name: newStaff.name,
              employee_id: newStaff.employee_id,
              email: newStaff.email,
              password: newStaff.password,
              role: newStaff.role,
              department: newStaff.department,
              branch: newStaff.branch,
              phone: newStaff.phone,
              profile_image_url: newStaff.profileImage || null,
            })
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase insert failed:', supabaseError);
            
            // Provide user-friendly error messages
            if (supabaseError.code === '23505') {
              if (supabaseError.message.includes('employee_id')) {
                throw new Error('Employee ID already exists. Please use a different Employee ID.');
              } else if (supabaseError.message.includes('email')) {
                throw new Error('Email already exists. Please use a different email address.');
              }
            }
            
            throw new Error(supabaseError.message || 'Failed to create staff');
          }

          console.log('Staff created successfully in Supabase:', supabaseData);
          
          // Also add to IndexedDB for immediate UI update
          const staffForDB: OfflineStaff = {
            id: supabaseData.id,
            name: supabaseData.name,
            email: supabaseData.email,
            role: supabaseData.role,
            department: supabaseData.department,
            branch: supabaseData.branch,
            phone: supabaseData.phone,
            profile_image_url: supabaseData.profile_image_url,
            created_at: supabaseData.created_at,
            updated_at: supabaseData.updated_at,
            _isOffline: false,
            _lastSync: Date.now(),
          };
          
          await offlineDB.staff.put(staffForDB);
          console.log('Staff also added to IndexedDB for UI update');
          
          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: staffForDB
          };
        } else {
          // OFFLINE: Local storage only
          console.log('Offline mode: Storing staff locally...');
          const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const staffData: OfflineStaff = {
            id: offlineId,
            name: newStaff.name,
            email: newStaff.email,
            role: newStaff.role,
            department: newStaff.department,
            branch: newStaff.branch,
            phone: newStaff.phone,
            profile_image_url: newStaff.profileImage || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };

          // Store locally only
          await offlineDB.staff.add(staffData);
          
          // Queue for sync when online
          await syncService.queueOperation('staff', 'create', {
            id: offlineId,
            name: newStaff.name,
            employee_id: newStaff.employee_id,
            email: newStaff.email,
            password: newStaff.password,
            role: newStaff.role,
            department: newStaff.department,
            branch: newStaff.branch,
            phone: newStaff.phone,
            profile_image_url: newStaff.profileImage || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: staffData };
        }
      } catch (error) {
        console.error("Error creating staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to create staff" 
        };
      }
    },
    onSuccess: async (result) => {
      if (result.success) {
        if (result.data && !result.data._isOffline) {
          toast.success("Staff created successfully in Supabase!");
        } else {
          toast.success("Staff added locally! Will sync when online.");
        }
        // Clear IndexedDB and refetch for instant UI update
        // Real-time sync will handle the update automatically
      } else {
        toast.error(result.error || "Failed to create staff.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create staff.");
    },
  });

  // Update staff mutation
  const updateMutation = useMutation<
    { success: boolean; data?: OfflineStaff; error?: string },
    Error,
    {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      branch?: string;
      phone?: string;
      profileImage?: string;
      oldProfileImageUrl?: string;
    }
  >({
    mutationFn: async (updateData) => {
      try {
        const existingStaff = await offlineDB.staff.get(updateData.id);
        if (!existingStaff) {
          throw new Error("Staff not found");
        }

        // CLEAN HYBRID FLOW: Online = Supabase only, Offline = Local only
        if (syncStatus.isOnline && !existingStaff._isOffline) {
          // ONLINE: Direct Supabase operation, no local storage
          console.log('Online mode: Updating staff directly in Supabase...');
          const supabase = createClient();
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('staff')
            .update({
              name: updateData.name,
              email: updateData.email,
              role: updateData.role,
              department: updateData.department,
              branch: updateData.branch,
              phone: updateData.phone,
              profile_image_url: updateData.profileImage || null,
            })
            .eq('id', updateData.id)
            .select()
            .single();

          if (supabaseError) {
            console.error('Supabase update failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Staff updated successfully in Supabase:', supabaseData);
          
          // Also update in IndexedDB for immediate UI update
          const staffForDB: OfflineStaff = {
            id: supabaseData.id,
            name: supabaseData.name,
            email: supabaseData.email,
            role: supabaseData.role,
            department: supabaseData.department,
            branch: supabaseData.branch,
            phone: supabaseData.phone,
            profile_image_url: supabaseData.profile_image_url,
            created_at: supabaseData.created_at,
            updated_at: supabaseData.updated_at,
            _isOffline: false,
            _lastSync: Date.now(),
          };
          
          await offlineDB.staff.put(staffForDB);
          console.log('Staff also updated in IndexedDB for UI update');
          
          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { 
            success: true, 
            data: staffForDB
          };
        } else {
          // OFFLINE: Local storage only
          console.log('Offline mode: Updating staff locally...');
          
          const updatedStaff: Partial<OfflineStaff> = {
            name: updateData.name,
            email: updateData.email,
            role: updateData.role,
            department: updateData.department,
            branch: updateData.branch,
            phone: updateData.phone,
            profile_image_url: updateData.profileImage || existingStaff.profile_image_url,
            updated_at: new Date().toISOString(),
            _isOffline: true,
            _lastSync: Date.now(),
          };

          // Update locally only
          await offlineDB.staff.update(updateData.id, updatedStaff);
          
          // Queue for sync when online
          await syncService.queueOperation('staff', 'update', {
            id: updateData.id,
            name: updateData.name,
            email: updateData.email,
            role: updateData.role,
            department: updateData.department,
            branch: updateData.branch,
            phone: updateData.phone,
            profile_image_url: updateData.profileImage || null,
            updated_at: new Date().toISOString(),
          });

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('dataUpdated'));

          return { success: true, data: { ...existingStaff, ...updatedStaff } };
        }
      } catch (error) {
        console.error("Error updating staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to update staff" 
        };
      }
    },
    onSuccess: async (result) => {
      if (result.success) {
        if (syncStatus.isOnline) {
          toast.success("Staff updated successfully!");
        } else {
          toast.success("Staff updated locally! Will sync when online.");
        }
        // Clear IndexedDB and refetch for instant UI update
        // Real-time sync will handle the update automatically
      } else {
        toast.error(result.error || "Failed to update staff.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update staff.");
    },
  });

  // Delete staff mutation
  const deleteMutation = useMutation<
    { success: boolean; error?: string },
    Error,
    string
  >({
    mutationFn: async (staffId) => {
      try {
        const existingStaff = await offlineDB.staff.get(staffId);
        if (!existingStaff) {
          throw new Error("Staff not found");
        }

        // CLEAN HYBRID FLOW: Online = Supabase only, Offline = Local only
        if (syncStatus.isOnline && !existingStaff._isOffline) {
          // ONLINE: Direct Supabase operation, no local storage
          console.log('Online mode: Deleting staff directly from Supabase...');
          const supabase = createClient();
          const { error: supabaseError } = await supabase
            .from('staff')
            .delete()
            .eq('id', staffId);

          if (supabaseError) {
            console.error('Supabase delete failed:', supabaseError);
            throw supabaseError;
          }

          console.log('Staff deleted successfully from Supabase');
          
          // Also delete from IndexedDB for immediate UI update
          await offlineDB.staff.delete(staffId);
          console.log('Staff also deleted from IndexedDB for UI update');
          
          // Save to localStorage for cross-browser sync
          await syncService.triggerCrossBrowserSync();
          
          // Invalidate and refetch to update UI
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });

          return { success: true };
        } else {
          // OFFLINE: Local storage only
          console.log('Offline mode: Deleting staff locally...');
          
          // Delete locally only
          await offlineDB.staff.delete(staffId);
          
          // Queue for sync when online
          await syncService.queueOperation('staff', 'delete', { id: staffId });

          // Cross-browser sync for offline data
          await syncService.triggerCrossBrowserSync();

          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["offline-staff"] });

          return { success: true };
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to delete staff" 
        };
      }
    },
    onSuccess: async (result) => {
      if (result.success) {
        if (syncStatus.isOnline) {
          toast.success("Staff deleted successfully!");
        } else {
          toast.success("Staff deleted locally! Will sync when online.");
        }
        // Clear IndexedDB and refetch for instant UI update
        // Real-time sync will handle the update automatically
      } else {
        toast.error(result.error || "Failed to delete staff.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete staff.");
    },
  });

  return {
    // Data
    staff: staff?.map(transformOfflineStaff) || [],
    isLoading,
    error,
    
    // Sync status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingOperations: syncStatus.pendingOperations,
    
    // Mutations
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    downloadData: syncService.downloadData.bind(syncService),
    syncAll: syncService.syncAll.bind(syncService),
    refreshPage,
  };
}
