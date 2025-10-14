'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2, User, MapPin, Calendar, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { MaintenanceRequest } from '@/types/maintenance';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MaintenanceApprovalDialogProps {
  request: MaintenanceRequest;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceApprovalDialog({ request, isOpen, onOpenChange }: MaintenanceApprovalDialogProps) {
  const { user } = useAuth();
  const { approveRequest, rejectRequest, isApproving, isRejecting } = useMaintenanceRequests();
  const [adminNotes, setAdminNotes] = useState('');

  const handleApprove = () => {
    if (!user?.id) {
      toast.error('Admin not authenticated');
      return;
    }

    approveRequest({
      id: request.id,
      adminId: user.id,
      notes: adminNotes || undefined,
    });
    onOpenChange(false);
    setAdminNotes('');
  };

  const handleReject = () => {
    if (!user?.id) {
      toast.error('Admin not authenticated');
      return;
    }

    rejectRequest({
      id: request.id,
      adminId: user.id,
      reason: adminNotes || 'No reason provided',
    });
    onOpenChange(false);
    setAdminNotes('');
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maintenance Request Details</DialogTitle>
          <DialogDescription>
            Review and approve or reject this maintenance request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Request Status</h3>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Requested On</p>
              <p className="text-sm">{format(new Date(request.requested_date), 'PPp')}</p>
            </div>
          </div>

          <Separator />

          {/* Staff Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Staff Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Staff Name</p>
                <p className="font-medium">{request.staff?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{request.staff?.employee_id || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{request.staff?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* System Details */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              System Details
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium">{request.serial_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workstation Number</p>
                <p className="font-medium">{request.workstation_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand Name</p>
                <p className="font-medium">{request.brand_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition</p>
                <Badge variant="outline" className="capitalize">{request.condition}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running Status</p>
                <Badge variant={request.running_status === 'running' ? 'default' : 'destructive'}>
                  {request.running_status === 'running' ? 'Running' : 'Not Running'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{request.branch}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Important Dates
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Report Month</p>
                <p className="font-medium">{format(new Date(request.report_month), 'MMMM yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Purchase</p>
                <p className="font-medium">{request.date_of_purchase ? format(new Date(request.date_of_purchase), 'PP') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Start Date</p>
                <p className="font-medium">{request.warranty_start_date ? format(new Date(request.warranty_start_date), 'PP') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty End Date</p>
                <p className="font-medium">{request.warranty_end_date ? format(new Date(request.warranty_end_date), 'PP') : '-'}</p>
              </div>
            </div>
          </div>

          {/* Approval/Rejection History */}
          {request.status !== 'pending' && (
            <div className="space-y-3">
              <h3 className="font-semibold">Decision Details</h3>
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {request.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver?.name || 'Admin'}
                  </span>
                </div>
                {request.approved_at && (
                  <p className="text-sm text-muted-foreground">
                    On {format(new Date(request.approved_at), 'PPp')}
                  </p>
                )}
                {request.admin_notes && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                    <p className="text-sm">{request.admin_notes}</p>
                  </div>
                )}
                {request.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 rounded">
                    <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{request.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons (only for pending requests) */}
          {request.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_notes">Admin Notes / Rejection Reason (Optional)</Label>
                  <Textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this approval or rejection..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
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
