"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskFilterControls } from "@/components/tasks/task-filter-controls";
import { TaskStatsCards } from "@/components/tasks/task-stats-cards";
import { TaskStatus, TaskPriority, Task } from "@/types";

interface TasksPageClientProps {
  tasks: Task[];
}

export function TasksPageClient({ tasks }: TasksPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    // TODO: Implement server action for updating task status
    console.log("Updating task:", taskId, "to status:", newStatus);
    
    // For now, this would be handled by optimistic updates
    // or by calling a server action that updates the database
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="mb-6">
        <TaskStatsCards tasks={tasks} />
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
        <TaskFilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onTaskStatusChange={handleTaskStatusChange}
      />
    </>
  );
}
