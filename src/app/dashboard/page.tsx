import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"

export default function Page() {
  // Transform the existing data to match our DashboardData interface
  const dashboardData = {
    tasks: data.map((item: { id: number; header: string; status: string; reviewer: string }) => ({
      id: item.id.toString(),
      name: item.header,
      status: item.status === "Done" ? "completed" : item.status === "In Process" ? "in_progress" : "todo",
      priority: "medium",
      assignee: { name: item.reviewer },
      due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    staff: [
      { id: "1", name: "Eddie Lake" },
      { id: "2", name: "Jamik Tashpulatov" },
      { id: "3", name: "Emily Whalen" },
    ],
    teams: [
      { id: "1", name: "Development Team" },
      { id: "2", name: "Design Team" },
    ],
    stats: {
      totalTasks: data.length,
      completedTasks: data.filter((item: { status: string }) => item.status === "Done").length,
      inProgressTasks: data.filter((item: { status: string }) => item.status === "In Process").length,
      totalStaff: 3,
      totalTeams: 2,
    }
  };
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
              <SectionCards data={dashboardData} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={dashboardData} />
              </div>
              <DataTable data={dashboardData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
