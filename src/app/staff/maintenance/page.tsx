'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { MaintenanceFormDialog } from '@/components/maintenance/maintenance-form-dialog';
import { PurchaseRequisitionDialog } from '@/components/maintenance/purchase-requisition-dialog';
import { PurchaseApprovalDialog } from '@/components/admin/purchase-approval-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';

export default function StaffMaintenancePage() {
  const { user } = useAuth();
  const { requests, isLoading, createRequest, updateRequest, isCreating, isUpdating } = useMaintenanceRequests(user?.staffId);
  const { requisitions: myPurchases, isLoading: isPurchaseLoading, createRequisition, isCreating: isPurchaseCreating } = usePurchaseRequisitions(user?.staffId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequisition | null>(null);
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false);

  // Calculate stats for maintenance
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // Calculate stats for purchases
  const purchaseStats = {
    total: myPurchases.length,
    pending: myPurchases.filter(r => r.status === 'pending').length,
    approved: myPurchases.filter(r => r.status === 'approved').length,
    rejected: myPurchases.filter(r => r.status === 'rejected').length,
  };

  const handleOpenForm = (request?: MaintenanceRequest) => {
    setEditingRequest(request || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = (data: any) => {
    if (editingRequest) {
      updateRequest({ id: editingRequest.id, formData: data });
    } else {
      createRequest(data);
    }
    handleCloseForm();
  };

  const handlePurchaseSubmit = (data: any) => {
    createRequisition(data, {
      onSuccess: () => {
        setIsPurchaseDialogOpen(false);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRunningStatusBadge = (status: string) => {
    return status === 'running' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">Not Running</Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance & Purchase Requests</h1>
          <p className="text-muted-foreground">
            Track and manage your maintenance requests and purchase requisitions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Add System Record
          </Button>
          <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Product
          </Button>
        </div>
      </div>

      {/* Tabs for Maintenance and Purchases */}
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance Requests ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            My Purchase Requests ({purchaseStats.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} system entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% approved` : 'No approvals yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejected > 0 ? 'Requires attention' : 'No rejections'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Records</CardTitle>
          <CardDescription>
            View and manage all your system maintenance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No systems found</h3>
              <p className="text-muted-foreground mb-4">
                Add your first system record to get started
              </p>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add System Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Workstation</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Running Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request, index) => (
                    <TableRow key={request.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{request.serial_number || '-'}</TableCell>
                      <TableCell>{request.brand_name || '-'}</TableCell>
                      <TableCell>{request.workstation_number || '-'}</TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{request.condition}</Badge>
                      </TableCell>
                      <TableCell>{getRunningStatusBadge(request.running_status)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenForm(request)}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6 space-y-6">
          {/* Purchase Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.total} purchase requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.approved > 0 ? `${Math.round((purchaseStats.approved / purchaseStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.rejected > 0 ? 'Requires attention' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Requisitions Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Purchase Requisitions</CardTitle>
              <CardDescription>
                View all your submitted purchase requisitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPurchaseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : myPurchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No requisitions yet</h3>
                  <p className="text-muted-foreground">
                    You haven't submitted any purchase requisitions yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Purchase Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin Response</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myPurchases.map((req, index) => (
                        <TableRow key={req.id} className="hover:bg-muted/50">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{format(new Date(req.requested_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{req.purchase_item}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.description || '-'}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell className="max-w-xs">
                            {req.admin_notes && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Notes: </span>
                                {req.admin_notes}
                              </div>
                            )}
                            {req.rejection_reason && (
                              <div className="text-sm text-red-600">
                                <span className="font-medium">Reason: </span>
                                {req.rejection_reason}
                              </div>
                            )}
                            {!req.admin_notes && !req.rejection_reason && '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPurchase(req);
                                setIsPurchaseDetailsOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialogs */}
      <MaintenanceFormDialog
        isOpen={isFormOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={editingRequest}
        isSubmitting={isCreating || isUpdating}
      />

      <PurchaseRequisitionDialog
        isOpen={isPurchaseDialogOpen}
        onOpenChange={setIsPurchaseDialogOpen}
        onSubmit={handlePurchaseSubmit}
        isSubmitting={isPurchaseCreating}
      />

      {/* Purchase Details Dialog (view-only for staff) */}
      {selectedPurchase && (
        <PurchaseApprovalDialog
          requisition={selectedPurchase}
          isOpen={isPurchaseDetailsOpen}
          onOpenChange={setIsPurchaseDetailsOpen}
        />
      )}
    </div>
  );
}



