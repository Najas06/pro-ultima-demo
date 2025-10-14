'use client';

import { useState } from 'react';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MaintenanceRequest } from '@/types/maintenance';

export function MaintenanceNotificationDropdown() {
  const { requests, pendingCount, isLoading } = useMaintenanceRequests();
  const router = useRouter();

  // DEBUG: Log to see what's happening
  console.log('🔧 Maintenance notifications:', { 
    totalRequests: requests.length, 
    pendingCount,
    isLoading,
    requests: requests.map(r => ({ id: r.id, status: r.status, branch: r.branch }))
  });

  // Get recent pending requests (max 5)
  const recentPendingRequests = requests
    .filter(req => req.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleViewRequest = (requestId: string) => {
    router.push('/admin/maintenance');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Wrench className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-600 animate-in zoom-in-50 duration-200"
              variant="default"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Pending Maintenance Requests</h4>
          <p className="text-xs text-muted-foreground">
            {pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        
        {recentPendingRequests.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No pending requests
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
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
        
        <DropdownMenuItem 
          className="p-3 cursor-pointer"
          onClick={() => router.push('/admin/maintenance')}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All Requests
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
