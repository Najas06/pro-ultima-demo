'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Download } from 'lucide-react';
import { AddCashTransactionDialog } from '@/components/staff/add-cash-transaction-dialog';
import { CashSummaryCards } from '@/components/cashbook/cash-summary-cards';
import { useCashTransactions } from '@/hooks/use-cash-transactions';

export default function StaffCashbookPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  // Fetch staff details
  useEffect(() => {
    async function fetchStaff() {
      if (!user?.staffId) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', user.staffId)
        .single();
      
      if (data && !error) {
        setStaff(data);
      }
    }
    
    fetchStaff();
  }, [user]);

  const branch = staff?.branch || '';
  
  const {
    transactions,
    expenseCategories,
    summary,
    isLoading,
    refetch,
  } = useCashTransactions(branch, startDate || undefined, endDate || undefined);

  // Apply client-side filters
  const filteredTransactions = transactions.filter((t) => {
    if (billStatusFilter !== 'all' && t.bill_status !== billStatusFilter) return false;
    if (expenseCategoryFilter !== 'all' && t.nature_of_expense !== expenseCategoryFilter) return false;
    return true;
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setBillStatusFilter('all');
    setExpenseCategoryFilter('all');
  };

  if (!staff) {
    return (
      <div className="p-6">
        <p>Loading staff information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Book - {branch} Branch</h1>
          <p className="text-muted-foreground">
            View all branch transactions and manage petty cash
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <AddCashTransactionDialog branch={branch} />
        </div>
      </div>

      <CashSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by date, status, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bill_status">Bill Status</Label>
              <Select value={billStatusFilter} onValueChange={setBillStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_category">Nature of Expense</Label>
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Voucher No</th>
                  <th className="text-left p-2">Staff Member</th>
                  <th className="text-left p-2">Bill Status</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Nature</th>
                  <th className="text-right p-2">Cash Out</th>
                  <th className="text-right p-2">Cash In</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center p-4">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-4 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="p-2 font-mono text-sm">{transaction.voucher_no}</td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.staff?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{transaction.staff?.employee_id || ''}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            transaction.bill_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : transaction.bill_status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.bill_status}
                        </span>
                      </td>
                      <td className="p-2">{transaction.primary_list}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {transaction.nature_of_expense}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {transaction.cash_out > 0 ? `₹${transaction.cash_out.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        {transaction.cash_in > 0 ? `₹${transaction.cash_in.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ₹{transaction.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

