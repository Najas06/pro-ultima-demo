"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaff,
  updateStaff,
  deleteStaff,
  getAllStaff,
  getStaffById,
} from "@/lib/actions/staffActions";

// ============================================
// TYPES
// ============================================

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage: string | null;
}

interface CreateStaffInput {
  employeeName: string;
  employeeId: string;
  email: string;
  password: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage?: string;
}

interface UpdateStaffInput extends CreateStaffInput {
  id: string;
  oldProfileImageUrl?: string;
}

// ============================================
// CUSTOM HOOK: useStaff
// ============================================

export function useStaff() {
  const queryClient = useQueryClient();

  // ============================================
  // QUERY: Fetch All Staff
  // ============================================
  const {
    data: staffData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const result = await getAllStaff();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const employees = staffData || [];

  // ============================================
  // MUTATION: Create Staff with Optimistic Update
  // ============================================
  const createMutation = useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      const result = await createStaff({
        name: data.employeeName,
        employee_id: data.employeeId,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        branch: data.branch,
        phone: data.phone,
        profileImage: data.profileImage,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    // OPTIMISTIC UPDATE: Update UI before server responds
    onMutate: async (newEmployee) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ["staff"] });

      // Snapshot the previous value for rollback
      const previousStaff = queryClient.getQueryData<Employee[]>(["staff"]);

      // Optimistically update the cache with temporary data
      const optimisticEmployee: Employee = {
        id: `temp-${Date.now()}`,
        name: newEmployee.employeeName,
        employeeId: newEmployee.employeeId,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        branch: newEmployee.branch,
        phone: newEmployee.phone,
        profileImage: newEmployee.profileImage || null,
      };

      queryClient.setQueryData<Employee[]>(["staff"], (old) =>
        old ? [optimisticEmployee, ...old] : [optimisticEmployee]
      );

      // Return context for rollback
      return { previousStaff };
    },
    // ROLLBACK: If server fails, revert to previous state
    onError: (error, variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(["staff"], context.previousStaff);
      }
      toast.error(`Failed to create employee: ${error.message}`);
    },
    // SUCCESS: Show success message
    onSuccess: () => {
      toast.success("Employee created successfully!");
    },
    // ALWAYS: Refetch to sync with server (eventual consistency)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  // ============================================
  // MUTATION: Update Staff with Optimistic Update
  // ============================================
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStaffInput) => {
      const result = await updateStaff({
        id: data.id,
        name: data.employeeName,
        employee_id: data.employeeId,
        email: data.email,
        role: data.role,
        department: data.department,
        branch: data.branch,
        phone: data.phone,
        profileImage: data.profileImage,
        oldProfileImageUrl: data.oldProfileImageUrl,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (updatedEmployee) => {
      await queryClient.cancelQueries({ queryKey: ["staff"] });

      const previousStaff = queryClient.getQueryData<Employee[]>(["staff"]);

      // Optimistically update the specific employee
      queryClient.setQueryData<Employee[]>(["staff"], (old) =>
        old?.map((emp) =>
          emp.id === updatedEmployee.id
            ? {
                ...emp,
                name: updatedEmployee.employeeName,
                employeeId: updatedEmployee.employeeId,
                email: updatedEmployee.email,
                role: updatedEmployee.role,
                department: updatedEmployee.department,
                branch: updatedEmployee.branch,
                phone: updatedEmployee.phone,
                profileImage: updatedEmployee.profileImage || emp.profileImage,
              }
            : emp
        )
      );

      return { previousStaff };
    },
    onError: (error, variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(["staff"], context.previousStaff);
      }
      toast.error(`Failed to update employee: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Employee updated successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  // ============================================
  // MUTATION: Delete Staff with Optimistic Update
  // ============================================
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteStaff(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["staff"] });

      const previousStaff = queryClient.getQueryData<Employee[]>(["staff"]);

      // Optimistically remove the employee from the list
      queryClient.setQueryData<Employee[]>(["staff"], (old) =>
        old?.filter((emp) => emp.id !== deletedId)
      );

      return { previousStaff };
    },
    onError: (error, variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(["staff"], context.previousStaff);
      }
      toast.error(`Failed to delete employee: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Employee deleted successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  // ============================================
  // QUERY: Get Single Staff by ID
  // ============================================
  const useStaffById = (id?: string) => {
    return useQuery({
      queryKey: ["staff", id],
      queryFn: async () => {
        if (!id) return null;
        const result = await getStaffById(id);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    });
  };

  // ============================================
  // RETURN HOOK API
  // ============================================
  return {
    // Data
    employees,
    isLoading,
    isError,
    error,

    // Mutations
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Utilities
    useStaffById,
  };
}

