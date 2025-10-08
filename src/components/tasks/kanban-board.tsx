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
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { TaskDetailsDialog } from "./task-details-dialog";
import { Task, TaskStatus, TaskPriority } from "@/types";

const columns: { id: TaskStatus; title: string; color: string; icon: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100 dark:bg-gray-800", icon: "📋" },
  { id: "todo", title: "To Do", color: "bg-yellow-100 dark:bg-yellow-900/30", icon: "📝" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100 dark:bg-blue-900/30", icon: "⚡" },
  { id: "completed", title: "Completed", color: "bg-green-100 dark:bg-green-900/30", icon: "✅" },
];

interface KanbanBoardProps {
  tasks: Task[];
  searchQuery?: string;
  statusFilter?: TaskStatus | "all";
  priorityFilter?: TaskPriority | "all";
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function KanbanBoard({ 
  tasks, 
  searchQuery = "", 
  statusFilter = "all", 
  priorityFilter = "all",
  onTaskStatusChange,
  onTaskDelete
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
    const overId = over.id as string;
    
    // Check if dropping on a column or a task
    let newStatus: TaskStatus;
    if (columns.find(col => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      // If dropped on a task, find that task's status
      const targetTask = tasks.find(t => t.id === overId);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    // Get the current task status
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Call the parent component's handler
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleTaskDelete = (taskId: string) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
    setIsDetailsOpen(false);
  };

  // Droppable Column Component
  const DroppableColumn = ({ column, children }: { column: typeof columns[0]; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: column.id,
    });

    return (
      <div ref={setNodeRef} className="space-y-3">
        {children}
      </div>
    );
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <DroppableColumn key={column.id} column={column}>
                <Card className="border-2">
                  <CardHeader className=" bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{column.icon}</span>
                        <CardTitle className="text-sm font-semibold">
                          {column.title}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {columnTasks.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="">
                    <SortableContext
                      items={columnTasks.map(task => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3 min-h-[300px]">
                        {columnTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className={`w-16 h-16 rounded-full ${column.color} flex items-center justify-center mb-3 opacity-50`}>
                              <span className="text-2xl">{column.icon}</span>
                            </div>
                            <p className="text-sm font-medium">No tasks here</p>
                            <p className="text-xs">Drag tasks or create new ones</p>
                          </div>
                        ) : (
                          columnTasks.map((task) => (
                            <div key={task.id} onClick={() => handleTaskClick(task)}>
                              <TaskCard
                                task={task}
                                onEdit={() => handleTaskClick(task)}
                                onDelete={() => onTaskDelete && onTaskDelete(task.id)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90 cursor-grabbing">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onDelete={handleTaskDelete}
      />
    </>
  );
}
