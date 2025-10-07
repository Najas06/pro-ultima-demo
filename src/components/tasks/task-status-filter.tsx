"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus } from "@/types";
import { IconFilter } from "@tabler/icons-react";

interface TaskStatusFilterProps {
  value: TaskStatus | "all";
  onValueChange: (value: TaskStatus | "all") => void;
  label?: string;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function TaskStatusFilter({ 
  value, 
  onValueChange, 
  label = "Status" 
}: TaskStatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <IconFilter className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
