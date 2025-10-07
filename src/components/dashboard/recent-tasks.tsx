"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";
import { 
  IconClock, 
  IconCalendar, 
  IconUser, 
  IconArrowRight,
  IconAlertCircle
} from "@tabler/icons-react";

interface RecentTasksProps {
  tasks: Task[];
  limit?: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "todo":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "backlog":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

export function RecentTasks({ tasks, limit = 5 }: RecentTasksProps) {
  // Sort tasks by updated_at (most recent first) and take the limit
  const recentTasks = tasks
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              Latest task updates and activities
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent tasks</p>
            </div>
          ) : (
            recentTasks.map((task) => {
              const isOverdue = task.due_date && 
                new Date(task.due_date) < new Date() && 
                task.status !== "completed";

              return (
                <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{task.name}</h4>
                      {isOverdue && (
                        <IconAlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {formatPriority(task.priority)}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                        {formatStatus(task.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <IconUser className="h-3 w-3" />
                          <span className="truncate">{task.assignee.name}</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3" />
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {task.assignee && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

