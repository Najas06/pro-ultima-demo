import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TasksPageClient } from "./tasks-page-client"
import { Task } from "@/types";

// Mock data for demonstration - This would come from your database/API
const mockTasks: Task[] = [
  {
    id: "1",
    name: "Design new landing page",
    description: "Create a modern and responsive landing page design",
    status: "backlog",
    priority: "high",
    due_date: "2024-01-25T10:00:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    repeat: "none",
    assignee: {
      id: "1",
      name: "John Doe",
      email: "john.doe@company.com",
      role: "designer",
      department: "design",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  },
  {
    id: "2",
    name: "Implement user authentication",
    description: "Add login and registration functionality",
    status: "todo",
    priority: "urgent",
    due_date: "2024-01-20T10:00:00Z",
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
    repeat: "none",
    assignee: {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      role: "developer",
      department: "engineering",
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
    },
  },
  {
    id: "3",
    name: "Write API documentation",
    description: "Document all REST API endpoints",
    status: "in_progress",
    priority: "medium",
    due_date: "2024-01-22T10:00:00Z",
    created_at: "2024-01-17T10:00:00Z",
    updated_at: "2024-01-17T10:00:00Z",
    repeat: "none",
    assignee: {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "developer",
      department: "engineering",
      created_at: "2024-01-17T10:00:00Z",
      updated_at: "2024-01-17T10:00:00Z",
    },
  },
  {
    id: "4",
    name: "Setup CI/CD pipeline",
    description: "Configure automated testing and deployment",
    status: "completed",
    priority: "high",
    due_date: "2024-01-18T10:00:00Z",
    created_at: "2024-01-18T10:00:00Z",
    updated_at: "2024-01-18T10:00:00Z",
    repeat: "none",
    assignee: {
      id: "4",
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      role: "developer",
      department: "engineering",
      created_at: "2024-01-18T10:00:00Z",
      updated_at: "2024-01-18T10:00:00Z",
    },
  },
  {
    id: "5",
    name: "User research interviews",
    description: "Conduct interviews with potential users",
    status: "todo",
    priority: "medium",
    due_date: "2024-01-30T10:00:00Z",
    created_at: "2024-01-19T10:00:00Z",
    updated_at: "2024-01-19T10:00:00Z",
    repeat: "weekly",
    assignee: {
      id: "5",
      name: "Alex Brown",
      email: "alex.brown@company.com",
      role: "analyst",
      department: "product",
      created_at: "2024-01-19T10:00:00Z",
      updated_at: "2024-01-19T10:00:00Z",
    },
  },
];

// This is the server component that fetches data
export default function TasksPage() {
  // TODO: Replace with actual data fetching
  // const tasks = await getTasks();
  // const staff = await getStaff();
  // const teams = await getTeams();
  
  const tasks = mockTasks;

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
                  <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>
                </div>
                
                {/* Pass data to client component */}
                <TasksPageClient tasks={tasks} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
