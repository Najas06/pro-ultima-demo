"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task, Staff, Team } from "@/types";
import { 
  IconCheck, 
  IconClock, 
  IconUsers, 
  IconTrendingUp,
  IconAlertCircle,
  IconCalendar
} from "@tabler/icons-react";

interface DashboardStatsCardsProps {
  tasks: Task[];
  staff: Staff[];
  teams: Team[];
}

export function DashboardStatsCards({ tasks, staff, teams }: DashboardStatsCardsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== "completed"
  ).length;
  
  const totalStaff = staff.length;
  const totalTeams = teams.length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate tasks due this week
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksDueThisWeek = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) <= weekFromNow && 
    task.status !== "completed"
  ).length;

  const stats = [
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "All tasks in the system",
      icon: IconCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "+12%",
      trendColor: "text-green-600",
    },
    {
      title: "Completed",
      value: completedTasks,
      description: `${completionRate}% completion rate`,
      icon: IconCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "+8%",
      trendColor: "text-green-600",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently being worked on",
      icon: IconClock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      trend: "+3%",
      trendColor: "text-green-600",
    },
    {
      title: "Overdue",
      value: overdueTasks,
      description: "Tasks past due date",
      icon: IconAlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trend: "-2%",
      trendColor: "text-red-600",
    },
    {
      title: "Team Members",
      value: totalStaff,
      description: "Active staff members",
      icon: IconUsers,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "+1",
      trendColor: "text-green-600",
    },
    {
      title: "Teams",
      value: totalTeams,
      description: "Active teams",
      icon: IconUsers,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      trend: "0",
      trendColor: "text-gray-600",
    },
    {
      title: "Due This Week",
      value: tasksDueThisWeek,
      description: "Tasks due in next 7 days",
      icon: IconCalendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      trend: "+5",
      trendColor: "text-orange-600",
    },
    {
      title: "Productivity",
      value: `${completionRate}%`,
      description: "Overall completion rate",
      icon: IconTrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      trend: "+4%",
      trendColor: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${stat.trendColor} border-current`}
                >
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

