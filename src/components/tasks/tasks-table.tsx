"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { MoreVertical, Edit, Trash2, Calendar, Repeat, Users, User, Network } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { EditTaskDialog } from "./edit-task-dialog";
import { format } from "date-fns";

interface TasksTableProps {
  tasks: Task[];
  onDelete: (taskId: string) => void;
}

export function TasksTable({ tasks, onDelete }: TasksTableProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Get status badge color
  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      completed: "bg-green-100 text-green-800 hover:bg-green-100",
      in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      todo: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      backlog: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return styles[status] || styles.backlog;
  };

  // Get priority badge color
  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      urgent: "bg-red-100 text-red-800 hover:bg-red-100",
      high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      medium: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      low: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return styles[priority] || styles.low;
  };

  // Format status text
  const formatStatus = (status: TaskStatus) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format priority text
  const formatPriority = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Handle task edit
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  // Get assignee info
  const getAssigneeInfo = (task: Task) => {
    if (task.allocation_mode === "team" && task.team) {
      return {
        name: task.team.name,
        image: null,
        type: "team" as const,
      };
    } else if (task.assignee) {
      return {
        name: task.assignee.name,
        image: task.assignee.profile_image_url,
        type: "individual" as const,
      };
    }
    return null;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Task</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="text-muted-foreground">No tasks found</p>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const assigneeInfo = getAssigneeInfo(task);
                return (
                  <TableRow 
                    key={task.id}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/tasks/${task.id}/diagram`)}
                              className="hover:text-primary hover:underline transition-colors text-left"
                            >
                              {task.title}
                            </button>
                            {task.is_repeated && (
                              <Repeat className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assigneeInfo ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {assigneeInfo.image ? (
                              <AvatarImage src={assigneeInfo.image} alt={assigneeInfo.name} />
                            ) : (
                              <AvatarFallback>
                                {assigneeInfo.type === "team" ? (
                                  <Users className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{assigneeInfo.name}</div>
                            <span className="text-muted-foreground text-xs">
                              {assigneeInfo.type === "team" 
                                ? "Team" 
                                : task.assignee?.role || "Staff"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(task.status)}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {formatPriority(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No due date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/tasks/${task.id}/diagram`);
                            }}
                          >
                            <Network className="h-4 w-4 mr-2" />
                            View Diagram
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(task);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DeleteConfirmationDialog
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            }
                            title="Delete Task?"
                            description="Are you sure you want to delete this task? This action cannot be undone and will permanently remove the task from our servers."
                            onConfirm={() => onDelete(task.id)}
                            confirmText="Delete Task"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Task Dialog */}
      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </>
  );
}

