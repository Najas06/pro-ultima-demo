"use client";

import { useEffect } from "react";
import { initializePWA } from "@/lib/pwa";

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
    console.log('PWA Initializer: Starting PWA initialization...');

    // Initialize PWA features (service worker, manifest, install prompt)
    initializePWA();
    
    console.log('PWA Initializer: Initialization complete');

    // Cleanup on unmount
    return () => {
      isInitialized = false; // Reset flag on cleanup
    };
  }, []);

  return null;
}
