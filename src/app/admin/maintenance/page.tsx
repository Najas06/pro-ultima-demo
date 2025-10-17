'use client';

import { useState } from 'react';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { MaintenanceApprovalDialog } from '@/components/admin/maintenance-approval-dialog';
import { PurchaseApprovalDialog } from '@/components/admin/purchase-approval-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, Settings } from 'lucide-react';
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

export default function AdminMaintenancePage() {
  const { requests, pendingCount, isLoading, refetch } = useMaintenanceRequests();
  const { requisitions, isLoading: isPurchaseLoading, refetch: refetchPurchases } = usePurchaseRequisitions();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequisition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // Calculate stats for maintenance
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // Calculate stats for purchase requisitions
  const purchaseStats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status === 'pending').length,
    approved: requisitions.filter(r => r.status === 'approved').length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleViewPurchase = (purchase: PurchaseRequisition) => {
    setSelectedPurchase(purchase);
    setIsPurchaseDialogOpen(true);
  };

  const handleClosePurchaseDialog = () => {
    setIsPurchaseDialogOpen(false);
    setSelectedPurchase(null);
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
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Management</h1>
          <p className="text-muted-foreground">
            Review and approve maintenance requests and purchase requisitions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
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
            Purchase Requisitions ({purchaseStats.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Requires your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
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
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejected > 0 ? 'Rejected requests' : 'No rejections'}
            </p>
          </CardContent>
        </Card>
          </div>

          {/* Requests Table */}
          <Card>
        <CardHeader>
          <CardTitle>All Maintenance Requests</CardTitle>
          <CardDescription>
            Review and manage maintenance requests from all staff
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
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                No maintenance requests have been submitted yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Workstation</TableHead>
                    <TableHead>Running Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request, index) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewRequest(request)}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{request.staff?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>{request.serial_number || '-'}</TableCell>
                      <TableCell>{request.brand_name || '-'}</TableCell>
                      <TableCell>{request.workstation_number || '-'}</TableCell>
                      <TableCell>{getRunningStatusBadge(request.running_status)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRequest(request);
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

        <TabsContent value="purchases" className="mt-6 space-y-6">
          {/* Purchase Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All purchase requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{purchaseStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{purchaseStats.approved}</div>
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
                <div className="text-2xl font-bold text-red-600">{purchaseStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.rejected > 0 ? 'Rejected requisitions' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Requisitions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requisitions</CardTitle>
              <CardDescription>
                Review and approve purchase requisitions from staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPurchaseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : requisitions.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No requisitions found</h3>
                  <p className="text-muted-foreground">
                    No purchase requisitions have been submitted yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Purchase Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requisitions.map((req, index) => (
                        <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPurchase(req)}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{format(new Date(req.requested_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{req.staff?.name || 'Unknown'}</TableCell>
                          <TableCell>{req.designation}</TableCell>
                          <TableCell>{req.branch}</TableCell>
                          <TableCell>{req.purchase_item}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPurchase(req);
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

      {/* Approval Dialogs */}
      {selectedRequest && (
        <MaintenanceApprovalDialog
          request={selectedRequest}
          isOpen={isDialogOpen}
          onOpenChange={handleCloseDialog}
        />
      )}

      {selectedPurchase && (
        <PurchaseApprovalDialog
          requisition={selectedPurchase}
          isOpen={isPurchaseDialogOpen}
          onOpenChange={handleClosePurchaseDialog}
        />
      )}
    </div>
  );
}

