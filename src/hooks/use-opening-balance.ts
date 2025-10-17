'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BranchOpeningBalance } from '@/types/cashbook';

export function useOpeningBalance() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all opening balances
  const { data: openingBalances = [], isLoading } = useQuery<BranchOpeningBalance[]>({
    queryKey: ['opening-balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .order('branch');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Update/Insert opening balance
  const updateMutation = useMutation({
    mutationFn: async ({ branch, opening_balance }: { branch: string; opening_balance: number }) => {
      const { data: existing } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .eq('branch', branch)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('branch_opening_balances')
          .update({ 
            opening_balance, 
            updated_at: new Date().toISOString() 
          })
          .eq('branch', branch)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('branch_opening_balances')
          .insert({ 
            branch, 
            opening_balance,
            period_start: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Opening balance updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balance'] });
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    },
    onError: (error) => {
      toast.error('Failed to update opening balance: ' + (error as Error).message);
    },
  });

  return {
    openingBalances,
    isLoading,
    updateOpeningBalance: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}


