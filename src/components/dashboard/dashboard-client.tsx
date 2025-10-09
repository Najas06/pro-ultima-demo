"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Users, Clock, AlertCircle, ListTodo } from "lucide-react";
import { TaskAllocationDialog } from "@/components/tasks/task-allocation-dialog";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useOfflineTasks } from "@/hooks/use-offline-tasks";
import { useOfflineStaff } from "@/hooks/use-offline-staff";
import { useOfflineTeams } from "@/hooks/use-offline-teams";
import { SyncStatusIndicator } from "@/components/ui/sync-status-indicator";
import { useRouter } from "next/navigation";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Chart configuration
const statusChartConfig = {
  tasks: { label: "Tasks" },
  completed: { label: "Completed", color: "hsl(var(--chart-1))" },
  inProgress: { label: "In Progress", color: "hsl(var(--chart-2))" },
  todo: { label: "To Do", color: "hsl(var(--chart-3))" },
  backlog: { label: "Backlog", color: "hsl(var(--chart-4))" },
};

const priorityChartConfig = {
  tasks: { label: "Tasks" },
  urgent: { label: "Urgent", color: "hsl(var(--chart-1))" },
  high: { label: "High", color: "hsl(var(--chart-2))" },
  medium: { label: "Medium", color: "hsl(var(--chart-3))" },
  low: { label: "Low", color: "hsl(var(--chart-4))" },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "todo":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    case "backlog":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "medium":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "todo":
      return "To Do";
    case "backlog":
      return "Backlog";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

export function DashboardClient() {
  const { tasks, deleteTask } = useOfflineTasks();
  const { staff, deleteStaff } = useOfflineStaff();
  const { teams, deleteTeam } = useOfflineTeams();
  const router = useRouter();
  
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [statusTimeRange, setStatusTimeRange] = useState("30d");
  const [priorityTimeRange, setPriorityTimeRange] = useState("30d");

  // Calculate stats from offline data
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    backlogTasks: tasks.filter(t => t.status === 'backlog').length,
    totalStaff: staff.length,
    totalTeams: teams.length,
    urgentTasks: tasks.filter(t => t.priority === 'urgent').length,
    highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length,
  };

  // Prepare time-series chart data
  const generateChartData = (days: number) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter tasks created on or before this date
      const tasksUpToDate = tasks.filter(t => {
        const taskDate = new Date(t.created_at || t.updated_at || today);
        return taskDate <= date;
      });
      
      data.push({
        date: dateStr,
        completed: tasksUpToDate.filter(t => t.status === 'completed').length,
        inProgress: tasksUpToDate.filter(t => t.status === 'in_progress').length,
        todo: tasksUpToDate.filter(t => t.status === 'todo').length,
        backlog: tasksUpToDate.filter(t => t.status === 'backlog').length,
        urgent: tasksUpToDate.filter(t => t.priority === 'urgent').length,
        high: tasksUpToDate.filter(t => t.priority === 'high').length,
        medium: tasksUpToDate.filter(t => t.priority === 'medium').length,
        low: tasksUpToDate.filter(t => t.priority === 'low').length,
      });
    }
    
    return data;
  };

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      default: return 30;
    }
  };

  const statusChartData = generateChartData(getDaysFromRange(statusTimeRange));
  const priorityChartData = generateChartData(getDaysFromRange(priorityTimeRange));

  const handleDeleteTask = async (taskId: string) => {
    deleteTask(taskId);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaff(staffId);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      deleteTeam(teamId);
    }
  };

  const recentTasks = tasks.slice(0, 10);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <SyncStatusIndicator showDownloadButton={false} />
          </div>
          <p className="text-muted-foreground mt-1">
            Overview of your tasks, staff, and teams
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TaskAllocationDialog
            
          />
          <Button variant="outline" onClick={() => setIsTeamDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
          <TeamFormDialog
            isOpen={isTeamDialogOpen}
            onOpenChange={setIsTeamDialogOpen}
            onSubmit={() => {}}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.urgentTasks} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeams} teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Status Distribution */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Task Status </CardTitle>
              <CardDescription>
                Showing task status trends over time
              </CardDescription>
            </div>
            <Select value={statusTimeRange} onValueChange={setStatusTimeRange}>
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={statusChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={statusChartData}>
                <defs>
                  <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-inProgress)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-inProgress)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillTodo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-todo)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-todo)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillBacklog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-backlog)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-backlog)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="backlog"
                  type="natural"
                  fill="url(#fillBacklog)"
                  stroke="var(--color-backlog)"
                  stackId="a"
                />
                <Area
                  dataKey="todo"
                  type="natural"
                  fill="url(#fillTodo)"
                  stroke="var(--color-todo)"
                  stackId="a"
                />
                <Area
                  dataKey="inProgress"
                  type="natural"
                  fill="url(#fillInProgress)"
                  stroke="var(--color-inProgress)"
                  stackId="a"
                />
                <Area
                  dataKey="completed"
                  type="natural"
                  fill="url(#fillCompleted)"
                  stroke="var(--color-completed)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Priority </CardTitle>
              <CardDescription>
                Showing task priority trends over time
              </CardDescription>
            </div>
            <Select value={priorityTimeRange} onValueChange={setPriorityTimeRange}>
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={priorityChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={priorityChartData}>
                <defs>
                  <linearGradient id="fillUrgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-urgent)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-urgent)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-high)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-high)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-medium)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-medium)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-low)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-low)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="low"
                  type="natural"
                  fill="url(#fillLow)"
                  stroke="var(--color-low)"
                  stackId="a"
                />
                <Area
                  dataKey="medium"
                  type="natural"
                  fill="url(#fillMedium)"
                  stroke="var(--color-medium)"
                  stackId="a"
                />
                <Area
                  dataKey="high"
                  type="natural"
                  fill="url(#fillHigh)"
                  stroke="var(--color-high)"
                  stackId="a"
                />
                <Area
                  dataKey="urgent"
                  type="natural"
                  fill="url(#fillUrgent)"
                  stroke="var(--color-urgent)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest tasks and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tasks found. Create your first task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                recentTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {task.assignee?.name || task.team?.name || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No due date"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/tasks`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DeleteConfirmationDialog
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            }
                            title="Delete Task?"
                            description="Are you sure you want to delete this task? This action cannot be undone."
                            onConfirm={() => handleDeleteTask(task.id)}
                            confirmText="Delete Task"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff and Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Staff Card */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Active team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staff.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/staff`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {staff.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No staff members yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teams Card */}
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Active teams and their leaders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teams.slice(0, 5).map((team) => (
                <div key={team.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.leader?.name || "No leader"} • {team.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/teams`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No teams yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
