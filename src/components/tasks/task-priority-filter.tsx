"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority } from "@/types";

interface TaskPriorityFilterProps {
  value: TaskPriority | "all";
  onValueChange: (value: TaskPriority | "all") => void;
  label?: string;
}

const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function TaskPriorityFilter({ 
  value, 
  onValueChange, 
  label = "Priority" 
}: TaskPriorityFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
