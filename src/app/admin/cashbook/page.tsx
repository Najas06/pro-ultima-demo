'use client';

import { useState } from 'react';
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
import { RefreshCw, Download, TrendingUp, Eye } from 'lucide-react';
import { CashSummaryCards } from '@/components/cashbook/cash-summary-cards';
import { TransactionDetailsDialog } from '@/components/admin/transaction-details-dialog';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import { useStaff } from '@/hooks/use-staff';
import type { CashTransaction } from '@/types/cashbook';

export default function AdminCashbookPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { staff } = useStaff();
  
  const {
    transactions,
    expenseCategories,
    summary,
    isLoading,
    refetch,
  } = useCashTransactions(
    selectedBranch !== 'all' ? selectedBranch : undefined,
    startDate || undefined,
    endDate || undefined
  );

  // Get unique branches from staff
  const branches = Array.from(new Set(staff.map(s => s.branch).filter(Boolean))) as string[];

  // Apply client-side filters
  const filteredTransactions = transactions.filter((t) => {
    if (selectedStaff !== 'all' && t.staff_id !== selectedStaff) return false;
    if (billStatusFilter !== 'all' && t.bill_status !== billStatusFilter) return false;
    if (expenseCategoryFilter !== 'all' && t.nature_of_expense !== expenseCategoryFilter) return false;
    return true;
  });

  const handleClearFilters = () => {
    setSelectedBranch('all');
    setSelectedStaff('all');
    setStartDate('');
    setEndDate('');
    setBillStatusFilter('all');
    setExpenseCategoryFilter('all');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Book - Admin View</h1>
          <p className="text-muted-foreground">
            View and manage cash transactions across all branches
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <CashSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by branch, staff, date, status, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Label htmlFor="expense_category">Expense Category</Label>
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
            <p className="text-sm text-muted-foreground">
              {filteredTransactions.length} transaction(s) found
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Comprehensive view of cash transactions across all branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Voucher</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-left p-2">Staff</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Cash Out</th>
                  <th className="text-right p-2">Cash In</th>
                  <th className="text-right p-2">Balance</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="text-center p-4">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center p-4 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 text-sm">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="p-2 font-mono text-xs">{transaction.voucher_no}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {transaction.branch}
                        </span>
                      </td>
                      <td className="p-2 text-sm">{transaction.staff?.name || 'Unknown'}</td>
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
                      <td className="p-2 text-sm">{transaction.primary_list}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {transaction.nature_of_expense}
                      </td>
                      <td className="p-2 text-right text-red-600 font-medium">
                        {transaction.cash_out > 0 ? `₹${transaction.cash_out.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        {transaction.cash_in > 0 ? `₹${transaction.cash_in.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right font-bold">
                        ₹{transaction.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Branch-wise Summary */}
      {selectedBranch === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Branch-wise Summary</CardTitle>
            <CardDescription>Cash flow breakdown by branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branches.map((branch) => {
                const branchTransactions = transactions.filter(t => t.branch === branch);
                const branchCashIn = branchTransactions.reduce((sum, t) => sum + (t.cash_in || 0), 0);
                const branchCashOut = branchTransactions.reduce((sum, t) => sum + (t.cash_out || 0), 0);
                const branchBalance = branchCashIn - branchCashOut;

                return (
                  <div key={branch} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{branch}</p>
                      <p className="text-sm text-muted-foreground">
                        {branchTransactions.length} transactions
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cash In</p>
                        <p className="font-medium text-green-600">
                          +₹{branchCashIn.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cash Out</p>
                        <p className="font-medium text-red-600">
                          -₹{branchCashOut.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net</p>
                        <p className={`font-bold ${branchBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {branchBalance >= 0 ? '+' : ''}₹{branchBalance.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}



