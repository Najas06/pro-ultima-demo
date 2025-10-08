"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { IconGripVertical, IconCalendar, IconUser } from "@tabler/icons-react";
import { Repeat, Users, Clock } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const getPriorityColor = (priority: TaskPriority) => {
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

const getStatusColor = (status: TaskStatus) => {
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

const formatPriority = (priority: TaskPriority) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatStatus = (status: TaskStatus) => {
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

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isDragging ? "opacity-50 shadow-2xl scale-105" : ""
      } ${isOverdue ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : "hover:border-primary/30"}`}
    >
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {task.title}
            </CardTitle>
            {task.description && (
              <CardDescription className="text-xs mt-1.5 line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-1.5 hover:bg-muted rounded-md cursor-grab active:cursor-grabbing transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <IconGripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className=" space-y-2.5">
        {/* Priority Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs font-medium">
            {formatPriority(task.priority)}
          </Badge>
          
          {/* Repeat Indicator */}
          {task.is_repeated && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {task.repeat_config?.frequency}
            </Badge>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border">
              <AvatarImage src={task.assignee.profile_image_url || ""} />
              <AvatarFallback className="text-xs bg-primary/10">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate font-medium">
              {task.assignee.name}
            </span>
          </div>
        )}

        {/* Team Assignment */}
        {task.allocation_mode === "team" && task.team && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-100 dark:border-purple-900/30">
            <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-900 dark:text-purple-100 font-medium truncate">
              {task.team.name}
            </span>
            {task.assigned_staff && task.assigned_staff.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-auto">
                {task.assigned_staff.length}
              </Badge>
            )}
          </div>
        )}

        {/* Due Date */}
        {task.due_date && (
          <div className={`flex items-center gap-2 p-2 rounded-md ${
            isOverdue 
              ? "bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50" 
              : "bg-muted/50"
          }`}>
            <IconCalendar className={`h-3 w-3 ${isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${isOverdue ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>
              {formatDate(task.due_date)}
              {isOverdue && <span className="ml-1 font-bold">⚠️</span>}
            </span>
          </div>
        )}

        {/* Time Range for Repeated Tasks */}
        {task.is_repeated && task.repeat_config?.has_specific_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.repeat_config.start_time} - {task.repeat_config.end_time}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
