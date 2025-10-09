"use client";

import { useEffect } from "react";
import { initializePWA } from "@/lib/pwa";
import { syncService } from "@/lib/offline/sync-service";

export function PWAInitializer() {
  useEffect(() => {
    // Initialize PWA features
    initializePWA();
    
    // Download initial data when online
    const downloadInitialData = async () => {
      if (navigator.onLine) {
        try {
          await syncService.downloadData();
          console.log('Initial data downloaded successfully');
        } catch (error) {
          console.error('Failed to download initial data:', error);
        }
      }
    };

    // Download data on first load if online
    downloadInitialData();

    // Cleanup on unmount
    return () => {
      syncService.destroy();
    };
  }, []);

  return null;
}
