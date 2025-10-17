'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Loader2, User, MapPin, Calendar, Package, Clock, Eye, Download, FileText, File, Archive, Building, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { PurchaseRequisition } from '@/types/maintenance';
import { format } from 'date-fns';

interface PurchaseApprovalDialogProps {
  requisition: PurchaseRequisition;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseApprovalDialog({ requisition, isOpen, onOpenChange }: PurchaseApprovalDialogProps) {
  const { user } = useAuth();
  const { approveRequisition, rejectRequisition, isApproving, isRejecting } = usePurchaseRequisitions();
  const [adminNotes, setAdminNotes] = useState('');

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
    if (['zip', 'rar', '7z'].includes(ext || '')) return 'zip';
    return 'file';
  };

  const handleApprove = () => {
    if (!user?.id) {
      toast.error('Admin not authenticated');
      return;
    }

    approveRequisition({
      id: requisition.id,
      adminId: user.id,
      notes: adminNotes || undefined,
      requisition: requisition,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setAdminNotes('');
      },
    });
  };

  const handleReject = () => {
    if (!user?.id) {
      toast.error('Admin not authenticated');
      return;
    }

    if (!adminNotes) {
      toast.error('Please provide a rejection reason');
      return;
    }

    rejectRequisition({
      id: requisition.id,
      adminId: user.id,
      reason: adminNotes,
      requisition: requisition,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setAdminNotes('');
      },
    });
  };

  const getStatusBadge = () => {
    switch (requisition.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{requisition.status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Purchase Requisition Details</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            Review and approve/reject the purchase requisition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Information */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Requested By</p>
                <p className="font-medium">{requisition.name}</p>
                <p className="text-sm text-muted-foreground">
                  {requisition.staff?.employee_id} • {requisition.staff?.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Designation</p>
                  <p className="font-medium text-sm">{requisition.designation}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium text-sm">{requisition.department}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium text-sm">{requisition.branch}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Requested On</p>
                <p className="font-medium text-sm">
                  {format(new Date(requisition.requested_date), 'PPp')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Purchase Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-blue-100 rounded-full">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Purchase Item</p>
                <p className="font-medium text-lg">{requisition.purchase_item}</p>
              </div>
            </div>

            {requisition.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 bg-muted p-3 rounded-md">{requisition.description}</p>
              </div>
            )}
          </div>

          {/* Quotation Files Gallery */}
          {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Files ({requisition.quotation_urls.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {requisition.quotation_urls.map((url, index) => {
                      const fileType = getFileIcon(url);
                      const fileName = url.split('/').pop() || `File ${index + 1}`;
                      
                      return (
                        <div key={index} className="relative group rounded-xl border overflow-hidden">
                          {fileType === 'image' ? (
                            <img src={url} className="h-40 w-full object-cover" alt={fileName} />
                          ) : (
                            <div className="h-40 bg-muted flex flex-col items-center justify-center p-2">
                              {fileType === 'pdf' && <FileText className="h-12 w-12 text-red-600" />}
                              {fileType === 'doc' && <FileText className="h-12 w-12 text-blue-600" />}
                              {fileType === 'excel' && <FileText className="h-12 w-12 text-green-600" />}
                              {fileType === 'zip' && <Archive className="h-12 w-12 text-orange-600" />}
                              {fileType === 'file' && <File className="h-12 w-12 text-gray-600" />}
                              <p className="text-xs mt-2 text-center truncate w-full">{fileName}</p>
                            </div>
                          )}
                          <div className="p-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.open(url, '_blank')}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                              <a href={url} download={fileName}>
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Approval/Rejection Info */}
          {requisition.status !== 'pending' && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                {requisition.status === 'approved' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {requisition.status === 'approved' ? 'Approved' : 'Rejected'} by {requisition.admin?.name || 'Admin'}
                  </p>
                </div>
              </div>
              {requisition.approved_at && (
                <p className="text-sm text-muted-foreground">
                  On {format(new Date(requisition.approved_at), 'PPp')}
                </p>
              )}
              {requisition.admin_notes && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                  <p className="text-sm">{requisition.admin_notes}</p>
                </div>
              )}
              {requisition.rejection_reason && (
                <div className="mt-2 p-2 bg-red-50 rounded">
                  <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{requisition.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons (only for pending requisitions) */}
          {requisition.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_notes">Admin Notes / Rejection Reason (Optional for Approve, Required for Reject)</Label>
                  <Textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this approval or rejection..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                  >
                    {isRejecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                  >
                    {isApproving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

