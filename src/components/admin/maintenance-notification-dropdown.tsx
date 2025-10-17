'use client';

import { useState } from 'react';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, Package, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';

export function MaintenanceNotificationDropdown() {
  const { requests, pendingCount: maintenancePending, isLoading } = useMaintenanceRequests();
  const { requisitions, isLoading: isPurchaseLoading } = usePurchaseRequisitions();
  const router = useRouter();

  // Get pending purchases
  const pendingPurchases = requisitions.filter(r => r.status === 'pending');
  const totalPending = maintenancePending + pendingPurchases.length;

  // DEBUG: Log to see what's happening
  console.log('🔧 Maintenance & Purchase notifications:', { 
    maintenanceTotal: requests.length, 
    maintenancePending,
    purchaseTotal: requisitions.length,
    purchasePending: pendingPurchases.length,
    totalPending,
    isLoading
  });

  // Get recent pending requests (max 5)
  const recentPendingRequests = requests
    .filter(req => req.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Get recent pending purchases (max 5)
  const recentPendingPurchases = pendingPurchases
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleViewRequest = (requestId: string) => {
    router.push('/admin/maintenance');
  };

  const handleViewPurchase = (purchaseId: string) => {
    router.push('/admin/maintenance');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Wrench className="h-5 w-5" />
          {totalPending > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-600 animate-in zoom-in-50 duration-200"
              variant="default"
            >
              {totalPending > 9 ? '9+' : totalPending}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Pending Requests & Requisitions</h4>
          <p className="text-xs text-muted-foreground">
            {totalPending} item{totalPending !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        
        {/* Maintenance Requests Section */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Maintenance Requests ({maintenancePending})
        </DropdownMenuLabel>
        
        {recentPendingRequests.length === 0 ? (
          <div className="px-3 py-2 text-center text-muted-foreground text-xs">
            No pending maintenance requests
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {recentPendingRequests.map((request) => (
              <DropdownMenuItem
                key={request.id}
                className="p-3 cursor-pointer"
                onClick={() => handleViewRequest(request.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {request.staff?.name || 'Unknown Staff'}
                      </p>
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {request.branch} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.serial_number || request.brand_name || 'System Request'}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Purchase Requisitions Section */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Purchase Requisitions ({pendingPurchases.length})
        </DropdownMenuLabel>

        {recentPendingPurchases.length === 0 ? (
          <div className="px-3 py-2 text-center text-muted-foreground text-xs">
            No pending purchase requisitions
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {recentPendingPurchases.map((purchase) => (
              <DropdownMenuItem
                key={purchase.id}
                className="p-3 cursor-pointer"
                onClick={() => handleViewPurchase(purchase.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {purchase.staff?.name || 'Unknown Staff'}
                      </p>
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {purchase.branch} • {formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {purchase.purchase_item}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="p-3 cursor-pointer"
          onClick={() => router.push('/admin/maintenance')}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All ({totalPending} pending)
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
