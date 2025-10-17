'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Loader2, AlertCircle, Building } from 'lucide-react';
import { useOpeningBalance } from '@/hooks/use-opening-balance';
import { useSystemOptions } from '@/hooks/use-system-options';

export function OpeningBalanceManager() {
  const { branches, isLoading: isLoadingOptions } = useSystemOptions();
  const { openingBalances, isLoading, updateOpeningBalance, isUpdating } = useOpeningBalance();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [newBalance, setNewBalance] = useState<number>(0);

  const openEditDialog = (branch: string) => {
    const currentBalance = openingBalances.find(ob => ob.branch === branch);
    setSelectedBranch(branch);
    setNewBalance(currentBalance?.opening_balance || 0);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (newBalance < 0) {
      return;
    }

    updateOpeningBalance(
      { branch: selectedBranch, opening_balance: newBalance },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedBranch('');
          setNewBalance(0);
        },
      }
    );
  };

  const getCurrentBalance = (branch: string): number => {
    const balance = openingBalances.find(ob => ob.branch === branch);
    return balance?.opening_balance || 0;
  };

  const getLastUpdated = (branch: string): string => {
    const balance = openingBalances.find(ob => ob.branch === branch);
    if (!balance?.updated_at) return 'Never';
    return format(new Date(balance.updated_at), 'MMM dd, yyyy h:mm a');
  };

  if (isLoading || isLoadingOptions) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Branch Opening Balances
          </CardTitle>
          <CardDescription>
            Set the opening cash balance for each branch. This remains until manually updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No branches found. Add staff members to see branches.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch}>
                    <TableCell className="font-medium">{branch}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-lg font-bold text-blue-600">
                        ₹{getCurrentBalance(branch).toLocaleString('en-IN', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getLastUpdated(branch)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(branch)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Opening Balance - {selectedBranch}</DialogTitle>
            <DialogDescription>
              This will update the starting balance for all cashbook calculations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Current Opening Balance
              </Label>
              <p className="text-2xl font-bold text-blue-600">
                ₹{getCurrentBalance(selectedBranch).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-balance">New Opening Balance (₹)</Label>
              <Input
                id="new-balance"
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                placeholder="Enter new opening balance"
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changing the opening balance will affect all cashbook calculations for this branch.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUpdating || newBalance < 0}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Balance'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

