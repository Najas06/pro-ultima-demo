"use client";

import { useEffect } from "react";
import { initializePWA } from "@/lib/pwa";
import { syncService } from "@/lib/offline/sync-service";

// Global flag to prevent multiple initializations
let isInitialized = false;

export function PWAInitializer() {
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('PWA Initializer: Already initialized, skipping...');
      return;
    }

    isInitialized = true;
    console.log('PWA Initializer: Starting initialization...');

    // Initialize PWA features
    initializePWA();
    
    // Download initial data when online
    const downloadInitialData = async () => {
      try {
        console.log('PWA Initializer: Starting data download...');
        await syncService.downloadData();
        console.log('PWA Initializer: Data downloaded successfully');
        
        // DO NOT auto-refresh - let React Query handle data updates
        
      } catch (error) {
        console.error('PWA Initializer: Failed to download initial data:', error);
      }
    };

    // Only download data once on first load
    downloadInitialData();

    // Cleanup on unmount
    return () => {
      syncService.destroy();
      isInitialized = false; // Reset flag on cleanup
    };
  }, []);

  return null;
}
