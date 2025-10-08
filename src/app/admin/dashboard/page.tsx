import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getDashboardData } from "@/lib/actions/dashboardActions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

// This is the server component that fetches real data
export default async function DashboardPage() {
  // Fetch real data from database
  const result = await getDashboardData();
  
  // Handle error state
  if (!result.success || !result.data) {
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
          <div className="flex flex-1 flex-col p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              <AlertDescription>
                {result.error || "Failed to load dashboard data. Please check your database connection."}
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p><strong>Troubleshooting steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Verify your Supabase connection in <code className="bg-muted px-1 py-0.5 rounded">.env.local</code></li>
                <li>Check if the <code className="bg-muted px-1 py-0.5 rounded">tasks</code>, <code className="bg-muted px-1 py-0.5 rounded">staff</code>, and <code className="bg-muted px-1 py-0.5 rounded">teams</code> tables exist</li>
                <li>Run the SQL schema files in Supabase SQL Editor</li>
                <li>Check browser console for detailed errors</li>
              </ol>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const { tasks, staff, teams, stats } = result.data;

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
          <DashboardClient 
            tasks={tasks}
            staff={staff}
            teams={teams}
            stats={stats}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Enable dynamic rendering (disable static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;