"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { Task, TaskStatus, TaskPriority } from "@/types";

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "To Do", color: "bg-yellow-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { id: "completed", title: "Completed", color: "bg-green-100" },
];

interface KanbanBoardProps {
  tasks: Task[];
  searchQuery?: string;
  statusFilter?: TaskStatus | "all";
  priorityFilter?: TaskPriority | "all";
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanBoard({ 
  tasks, 
  searchQuery = "", 
  statusFilter = "all", 
  priorityFilter = "all",
  onTaskStatusChange 
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Call the parent component's handler
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                      <CardTitle className="text-sm font-medium">
                        {column.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <SortableContext
                    items={columnTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[200px]">
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No tasks</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={(task) => console.log("Edit task:", task.id)}
                            onDelete={(task) => console.log("Delete task:", task.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
