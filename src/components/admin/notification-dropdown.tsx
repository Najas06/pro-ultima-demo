'use client';

import { useState } from 'react';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, Clock, CheckCircle2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { TaskUpdateProof } from '@/types/cashbook';

interface NotificationDropdownProps {
  onViewProof: (taskId: string) => void;
}

export function NotificationDropdown({ onViewProof }: NotificationDropdownProps) {
  const { proofs, pendingCount } = useTaskProofs();
  const { tasks } = useTasks();

  // Get recent pending proofs (max 5)
  const recentPendingProofs = proofs
    .filter(proof => proof.is_verified === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getStatusBadge = (proof: TaskUpdateProof) => {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (pendingCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary hover:bg-primary/90 animate-in zoom-in-50 duration-200"
            variant="default"
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Pending Proof Verifications</h4>
          <p className="text-xs text-muted-foreground">
            {pendingCount} proof{pendingCount !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        
        {recentPendingProofs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No pending verifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {recentPendingProofs.map((proof) => (
              <DropdownMenuItem
                key={proof.id}
                className="p-3 cursor-pointer"
                onClick={() => onViewProof(proof.task_id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusBadge(proof)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {getTaskTitle(proof.task_id)}
                      </p>
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {proof.staff?.name || 'Unknown Staff'} • {formatDistanceToNow(new Date(proof.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {proof.status.replace('_', ' ')}
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
          onClick={() => {
            // TODO: Navigate to full notifications page
            console.log('Navigate to full notifications page');
          }}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All Verifications
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

