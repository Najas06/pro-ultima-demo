"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { IconGripVertical, IconCalendar, IconUser } from "@tabler/icons-react";

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
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${isOverdue ? "border-red-200 bg-red-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {task.name}
            </CardTitle>
            {task.description && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          <div
            {...attributes}
            {...listeners}
            className="ml-2 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
          >
            <IconGripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Priority and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {formatPriority(task.priority)}
          </Badge>
          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
            {formatStatus(task.status)}
          </span>
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-2">
            <IconUser className="h-3 w-3 text-gray-400" />
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 truncate">
              {task.assignee.name}
            </span>
          </div>
        )}

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center gap-2">
            <IconCalendar className="h-3 w-3 text-gray-400" />
            <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
              {formatDate(task.due_date)}
            </span>
          </div>
        )}

        {/* Repeat Indicator */}
        {task.repeat && task.repeat !== "none" && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-500 capitalize">
              Repeats {task.repeat}
            </span>
          </div>
        )}

        {/* Team */}
        {task.team && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs text-gray-500 truncate">
              {task.team.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
