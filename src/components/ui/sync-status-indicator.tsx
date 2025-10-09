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
import { toast } from "sonner";

interface SyncStatusIndicatorProps {
  className?: string;
  showDownloadButton?: boolean;
}

export function SyncStatusIndicator({ 
  className, 
  showDownloadButton = false 
}: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState(() => {
    // Only access syncService on client-side
    if (typeof window === 'undefined') return { isOnline: false, isSyncing: false, lastSync: null, pendingOperations: 0 };
    return syncService.getStatus();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
      await syncService.forceSyncAll();
      toast.success('Data synced successfully!');
    } catch (error) {
      console.error('Failed to sync:', error);
      toast.error('Failed to sync data. Check console for details.');
    }
  };

  const handleForceRefresh = async () => {
    try {
      await syncService.forceRefreshData();
      // Only reload when manually clicked, not automatically
      window.location.reload();
    } catch (error) {
      console.error('Failed to force refresh:', error);
    }
  };

  const handleCrossBrowserSync = async () => {
    try {
      await syncService.triggerCrossBrowserSync();
      toast.success('Cross-browser data synced successfully!');
      // Reload to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to sync cross-browser data:', error);
      toast.error('Failed to sync cross-browser data');
    }
  };

  const handleForceOnlineSync = async () => {
    try {
      await syncService.forceRefreshData();
      toast.success('Data synced with Supabase successfully!');
      // Reload to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to sync with Supabase:', error);
      toast.error('Failed to sync with Supabase. Working offline.');
    }
  };

  if (!syncStatus.isOnline) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap max-w-full", className)}>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 shrink-0">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
        <span className="text-xs text-orange-600 dark:text-orange-400 hidden md:inline truncate">
          Working offline - changes saved locally
        </span>
      </div>
    );
  }

  if (syncStatus.isSyncing) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap max-w-full", className)}>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shrink-0">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Syncing...
        </Badge>
        <span className="text-xs text-muted-foreground hidden md:inline truncate">
          Syncing with server
        </span>
      </div>
    );
  }

  if (syncStatus.pendingOperations > 0) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap max-w-full", className)}>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 shrink-0">
          <AlertCircle className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">{syncStatus.pendingOperations} pending</span>
          <span className="sm:hidden">{syncStatus.pendingOperations}</span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          className="h-6 px-1.5 sm:px-2 text-xs shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline ml-1">Sync</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 sm:gap-2 flex-wrap max-w-full", className)}>
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
      {syncStatus.lastSync && (
        <span className="text-xs text-muted-foreground hidden xl:inline truncate">
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </span>
      )}
      {showDownloadButton && (
        <>
          {/* Only show Refresh button on all screens */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceRefresh}
            className="h-6 px-1.5 sm:px-2 text-xs shrink-0"
            title="Force refresh data"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden lg:inline ml-1">Refresh</span>
          </Button>
          
          {/* Show other buttons only on very large screens */}
          <div className="hidden xl:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 px-2 text-xs"
              title="Download data"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCrossBrowserSync}
              className="h-6 px-2 text-xs"
              title="Sync data across browsers"
            >
              <Wifi className="w-3 h-3 mr-1" />
              Cross-Sync
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceOnlineSync}
              className="h-6 px-2 text-xs"
              title="Sync with Supabase"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Online-Sync
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile
export function SyncStatusCompact({ className }: { className?: string }) {
  const [syncStatus, setSyncStatus] = useState(() => {
    // Only access syncService on client-side
    if (typeof window === 'undefined') return { isOnline: false, isSyncing: false, lastSync: null, pendingOperations: 0 };
    return syncService.getStatus();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
