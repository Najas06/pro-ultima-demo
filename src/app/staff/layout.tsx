'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAttendance } from '@/hooks/use-attendance';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/staff-sidebar';
import { SiteHeader } from '@/components/site-header';
import { RealtimeTaskUpdate } from '@/components/staff/realtime-task-update';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { markLogin, useTodayAttendance } = useAttendance();
  const { data: todayAttendance } = useTodayAttendance(user?.staffId);
  const router = useRouter();

  // Mark login when staff portal is accessed
  useEffect(() => {
    if (user?.staffId && !todayAttendance) {
      markLogin(user.staffId);
    }
  }, [user?.staffId, todayAttendance, markLogin]);

  // Redirect if not authenticated or if admin (only non-admin users can access staff routes)
  useEffect(() => {
    if (!isLoading && (!user || user.role === 'admin')) {
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
      <StaffSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader userName={user?.name} userRole={user?.role} />
        <div className="flex flex-1 flex-col">
          <RealtimeTaskUpdate />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

