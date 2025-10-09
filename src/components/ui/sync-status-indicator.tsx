"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Download
} from "lucide-react";
import { syncService } from "@/lib/offline/sync-service";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  className?: string;
  showDownloadButton?: boolean;
}

export function SyncStatusIndicator({ 
  className, 
  showDownloadButton = false 
}: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  const handleDownload = async () => {
    try {
      await syncService.downloadData();
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const handleSync = async () => {
    try {
      await syncService.syncAll();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  if (!syncStatus.isOnline) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
        <span className="text-xs text-muted-foreground">
          Working offline
        </span>
      </div>
    );
  }

  if (syncStatus.isSyncing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Syncing...
        </Badge>
        <span className="text-xs text-muted-foreground">
          Syncing with server
        </span>
      </div>
    );
  }

  if (syncStatus.pendingOperations > 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          {syncStatus.pendingOperations} pending
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
      {syncStatus.lastSync && (
        <span className="text-xs text-muted-foreground">
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </span>
      )}
      {showDownloadButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-6 px-2 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
      )}
    </div>
  );
}

// Compact version for mobile
export function SyncStatusCompact({ className }: { className?: string }) {
  const [syncStatus, setSyncStatus] = useState(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-orange-500" />;
    }
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (syncStatus.pendingOperations > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {getStatusIcon()}
    </div>
  );
}
