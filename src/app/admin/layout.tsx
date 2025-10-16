'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { RealtimeDataSync } from '@/components/admin/realtime-data-sync';
import { cleanupOldIndexedDB } from '@/lib/cleanup-indexdb';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Cleanup old IndexedDB on mount
  useEffect(() => {
    cleanupOldIndexedDB();
  }, []);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader userName={user?.name} userRole={user?.role} />
        <div className="flex flex-1 flex-col">
          <RealtimeDataSync />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

