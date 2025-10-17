'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Building, 
  FileText, 
  Eye, 
  Download,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import type { CashTransaction } from '@/types/cashbook';

interface TransactionDetailsDialogProps {
  transaction: CashTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({ 
  transaction, 
  open, 
  onOpenChange 
}: TransactionDetailsDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!transaction) return null;

  const isCashOut = transaction.cash_out > 0;
  const amount = isCashOut ? transaction.cash_out : transaction.cash_in;
  const transactionType = isCashOut ? 'Cash Out (Expense)' : 'Cash In (Receipt)';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = () => {
    return isCashOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm font-mono">
                Voucher #{transaction.voucher_no}
              </Badge>
              <DialogTitle>Transaction Details</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Transaction Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <div className="flex items-center gap-2">
                      {isCashOut ? (
                        <ArrowDownLeft className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-2xl font-bold">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <Badge className={getTransactionTypeColor()}>
                      {transactionType}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(transaction.bill_status)}>
                      {transaction.bill_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Staff Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Staff Name</Label>
                    <p className="font-medium">{transaction.staff?.name || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="font-mono text-sm">{transaction.staff?.employee_id || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{transaction.staff?.email || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{transaction.branch}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{transaction.primary_list}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nature of Expense</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{transaction.nature_of_expense}</p>
                </div>
                
                {transaction.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded-md">{transaction.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Gallery Card */}
            {transaction.attachment_urls && transaction.attachment_urls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Attached Images ({transaction.attachment_urls.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {transaction.attachment_urls.map((url, index) => (
                      <div key={index} className="relative group rounded-xl border bg-card overflow-hidden">
                        {/* Image Preview */}
                        <div className="relative h-40 bg-muted">
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => setSelectedImageIndex(index)}
                          />
                        </div>
                        
                        {/* Actions */}
                        <div className="p-2 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            asChild
                            className="flex-1"
                          >
                            <a href={url} download={`receipt-${transaction.voucher_no}-${index + 1}.jpg`}>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy single image support */}
            {transaction.receipt_image_url && (!transaction.attachment_urls || transaction.attachment_urls.length === 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Receipt Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative group rounded-xl border bg-card overflow-hidden max-w-md">
                    <div className="relative h-40 bg-muted">
                      <img
                        src={transaction.receipt_image_url}
                        alt="Receipt"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setSelectedImageIndex(0)}
                      />
                    </div>
                    
                    <div className="p-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedImageIndex(0)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        asChild
                        className="flex-1"
                      >
                        <a href={transaction.receipt_image_url} download={`receipt-${transaction.voucher_no}.jpg`}>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size Image Modal */}
      {selectedImageIndex !== null && (
        <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={
                  transaction.attachment_urls && transaction.attachment_urls.length > 0
                    ? transaction.attachment_urls[selectedImageIndex]
                    : transaction.receipt_image_url
                }
                alt={`Full size image ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedImageIndex(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
