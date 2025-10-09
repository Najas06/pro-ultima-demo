"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offlineDB, OfflineStaff } from "@/lib/offline/database";
import { syncService } from "@/lib/offline/sync-service";
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
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Query to fetch all staff (offline-first)
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery<OfflineStaff[], Error>({
    queryKey: ["offline-staff"],
    queryFn: async () => {
      return await offlineDB.staff.orderBy('created_at').reverse().toArray();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
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
        // Generate offline ID
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

        // Add to offline database
        await offlineDB.staff.add(staffData);

        // Queue for sync
        await syncService.queueOperation('staff', 'create', {
          name: newStaff.name,
          employee_id: newStaff.employee_id,
          email: newStaff.email,
          password: newStaff.password,
          role: newStaff.role,
          department: newStaff.department,
          branch: newStaff.branch,
          phone: newStaff.phone,
          profile_image_url: newStaff.profileImage,
        });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-staff"] });

        return { success: true, data: staffData };
      } catch (error) {
        console.error("Error creating staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to create staff" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Staff created successfully!");
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

        // Update in offline database
        await offlineDB.staff.update(updateData.id, updatedStaff);

        // Queue for sync
        await syncService.queueOperation('staff', 'update', {
          id: updateData.id,
          name: updateData.name,
          email: updateData.email,
          role: updateData.role,
          department: updateData.department,
          branch: updateData.branch,
          phone: updateData.phone,
          profile_image_url: updateData.profileImage,
        });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-staff"] });

        return { success: true, data: { ...existingStaff, ...updatedStaff } };
      } catch (error) {
        console.error("Error updating staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to update staff" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Staff updated successfully!");
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
        // Delete from offline database
        await offlineDB.staff.delete(staffId);

        // Queue for sync
        await syncService.queueOperation('staff', 'delete', { id: staffId });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["offline-staff"] });

        return { success: true };
      } catch (error) {
        console.error("Error deleting staff:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to delete staff" 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Staff deleted successfully!");
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
  };
}
