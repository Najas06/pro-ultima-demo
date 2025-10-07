"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { StaffTable } from "@/components/staff/staff-table"
import { StaffFormDialog } from "@/components/staff/staff-form-dialog"
import { useUIStore } from "@/stores/ui-store"

export default function StaffPage() {
  const { staffDialog } = useUIStore();

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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between space-y-2 mb-6">
                  <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
                </div>
                
                <StaffTable />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Staff Form Dialog */}
      <StaffFormDialog 
        mode={staffDialog.mode}
        staffId={staffDialog.staffId}
      />
    </SidebarProvider>
  );
}
