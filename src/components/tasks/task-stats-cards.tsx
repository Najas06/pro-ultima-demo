"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task, TaskStatus } from "@/types";
import { IconCheck, IconClock, IconList, IconProgress } from "@tabler/icons-react";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const totalTasks = tasks.length;
  const completedTasks = getTasksByStatus("completed").length;
  const inProgressTasks = getTasksByStatus("in_progress").length;
  const incompleteTasks = getTasksByStatus("backlog").length + getTasksByStatus("todo").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "All tasks in the system",
      icon: IconList,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed",
      value: completedTasks,
      description: `${completionRate}% completion rate`,
      icon: IconCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently being worked on",
      icon: IconProgress,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Incomplete",
      value: incompleteTasks,
      description: "Backlog and to-do items",
      icon: IconClock,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
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
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
