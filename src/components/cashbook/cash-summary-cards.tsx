'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from 'lucide-react';
import type { CashBookSummary } from '@/types/cashbook';

interface CashSummaryCardsProps {
  summary: CashBookSummary;
}

export function CashSummaryCards({ summary }: CashSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{summary.opening_balance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground">
            Starting balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +₹{summary.total_cash_in.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground">
            Total receipts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            -₹{summary.total_cash_out.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground">
            Total expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₹{summary.closing_balance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.transaction_count} transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


