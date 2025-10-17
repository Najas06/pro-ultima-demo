"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export interface SystemOptions {
  roles: string[];
  departments: string[];
  branches: string[];
}

export function useSystemOptions() {
  const supabase = createClient();
  
  const { data, isLoading, error, refetch } = useQuery<SystemOptions>({
    queryKey: ['system-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('roles, departments, branches')
        .eq('email', 'admin@proultima.com')
        .single();

      if (error) throw error;

      return {
        roles: data?.roles || [],
        departments: data?.departments || [],
        branches: data?.branches || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('system-options-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admins',
        },
        () => {
          console.log('🔄 System options updated, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, supabase]);

  return {
    roles: data?.roles || [],
    departments: data?.departments || [],
    branches: data?.branches || [],
    isLoading,
    error,
    refetch,
  };
}

