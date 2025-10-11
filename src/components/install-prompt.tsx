"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  preventDefault(): void;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true
      );
    };

    // Detect iOS
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    const isiOS = checkIsIOS();
    const isStand = isInStandaloneMode();

    setIsIOS(isiOS);
    setIsStandalone(isStand);

    // Don't show prompt if already installed
    if (isStand) {
      console.log('App is already installed');
      return;
    }

    // Check if user has already dismissed the prompt
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
    if (hasSeenPrompt) {
      const dismissedTime = parseInt(hasSeenPrompt);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show iOS prompt after 3 seconds if on iOS
    if (isiOS) {
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show Android prompt after 3 seconds
      setTimeout(() => {
        setShowAndroidPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowIOSPrompt(false);
      setShowAndroidPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowIOSPrompt(false);
    setShowAndroidPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
  };

  // Don't show anything if already installed
  if (isStandalone) {
    return null;
  }

  // iOS Install Instructions
  if (showIOSPrompt && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-md">
        <Card className="border-2 border-blue-500 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500 p-2">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Install ProUltima</CardTitle>
                  <CardDescription>Add to Home Screen for quick access</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install this app on your iPhone:
              </p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    1
                  </span>
                  <span className="pt-0.5">
                    Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button at the bottom of your browser
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    2
                  </span>
                  <span className="pt-0.5">
                    Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    3
                  </span>
                  <span className="pt-0.5">
                    Tap <strong>&quot;Add&quot;</strong> to confirm
                  </span>
                </li>
              </ol>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Note:</strong> You must use <strong>Safari</strong> browser to install. Chrome and other browsers on iOS don&apos;t support installation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Android/Desktop Install Button
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-md">
        <Card className="border-2 border-blue-500 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500 p-2">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Install ProUltima</CardTitle>
                  <CardDescription>Get app-like experience on your device</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install this app for:
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Offline access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Faster loading</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Native app experience</span>
                </li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  size="sm"
                >
                  Not Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

