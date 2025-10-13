'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { CashTransaction, CashTransactionFormData, ExpenseCategory, BranchOpeningBalance, CashBookSummary } from '@/types/cashbook';

export function useCashTransactions(branch?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch cash transactions
  const { data: transactions = [], isLoading, error, refetch } = useQuery<CashTransaction[]>({
    queryKey: ['cash-transactions', branch, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('cash_transactions')
        .select(`
          *,
          staff:staff_id (
            name,
            employee_id,
            email
          )
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (branch) {
        query = query.eq('branch', branch);
      }

      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }

      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch expense categories
  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch branch opening balance
  const { data: openingBalance } = useQuery<BranchOpeningBalance | null>({
    queryKey: ['branch-opening-balance', branch],
    queryFn: async () => {
      if (!branch) return null;

      const { data, error } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .eq('branch', branch)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!branch,
  });

  // Calculate summary
  const summary: CashBookSummary = {
    opening_balance: openingBalance?.opening_balance || 0,
    total_cash_in: transactions.reduce((sum, t) => sum + (t.cash_in || 0), 0),
    total_cash_out: transactions.reduce((sum, t) => sum + (t.cash_out || 0), 0),
    closing_balance: 0,
    transaction_count: transactions.length,
  };

  summary.closing_balance = summary.opening_balance + summary.total_cash_in - summary.total_cash_out;

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cash-transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_transactions' },
        (payload) => {
          console.log('📡 Cash transaction changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
        }
      )
      .subscribe();

    const handleDataUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [queryClient, supabase]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (formData: CashTransactionFormData & { staff_id: string; branch: string; voucher_no: string }) => {
      // Calculate balance
      const previousBalance = transactions.length > 0 ? transactions[0].balance : (openingBalance?.opening_balance || 0);
      const newBalance = previousBalance + (formData.cash_in || 0) - (formData.cash_out || 0);

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert({
          ...formData,
          balance: newBalance,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transaction added successfully!');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to add transaction: ' + (error as Error).message);
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CashTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('cash_transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transaction updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to update transaction: ' + (error as Error).message);
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Transaction deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
    onError: (error) => {
      toast.error('Failed to delete transaction: ' + (error as Error).message);
    },
  });

  return {
    transactions,
    expenseCategories,
    openingBalance,
    summary,
    isLoading,
    error,
    refetch,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}


