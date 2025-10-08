"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, LayoutGrid, LayoutList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskAllocationDialog } from "./task-allocation-dialog";
import { KanbanBoard } from "./kanban-board";
import { TaskStatsCards } from "./task-stats-cards";
import { useTasks } from "@/hooks/use-tasks";
import { TaskStatus, TaskPriority } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function TasksManagement() {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle task status change (for drag & drop)
  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({
        id: taskId,
        title: task.title,
        description: task.description,
        allocation_mode: task.allocation_mode,
        assignee_id: task.assignee_id,
        team_id: task.team_id,
        assigned_staff_ids: task.assigned_staff?.map(a => a.staff_id),
        status: newStatus,
        priority: task.priority,
        due_date: task.due_date,
        start_date: task.start_date,
        is_repeated: task.is_repeated,
        repeat_config: task.repeat_config,
      });
    }
  };

  // Handle task delete
  const handleTaskDelete = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Task Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your tasks in one place
          </p>
        </div>
        
        <TaskAllocationDialog 
          trigger={
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <TaskStatsCards tasks={tasks} />
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("kanban")}
            title="Kanban View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task Views */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskDelete={handleTaskDelete}
        />
      ) : (
        <div className="space-y-3">
          {tasks
            .filter(task => {
              const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   task.description?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === "all" || task.status === statusFilter;
              const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
              return matchesSearch && matchesStatus && matchesPriority;
            })
            .map((task) => (
              <div key={task.id} className="w-full">
                <div onClick={() => {
                  // You can add task details dialog here if needed
                }}>
                  {/* Import TaskCard component for list view */}
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={
                            task.priority === "urgent" ? "destructive" :
                            task.priority === "high" ? "default" :
                            task.priority === "medium" ? "secondary" : "outline"
                          } className="text-xs">
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.allocation_mode === "team" && task.team && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {task.team.name}
                            </Badge>
                          )}
                          {task.assignee && (
                            <span className="text-xs text-muted-foreground">
                              Assigned to: {task.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
