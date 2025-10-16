"use client";

import { useState, useEffect } from "react";
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
import { MoreVertical, Edit, Trash2, Calendar, Repeat, Users, User, Network, Eye, CheckCircle, XCircle } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { EditTaskDialog } from "./edit-task-dialog";
import { TaskVerificationDialog } from "@/components/admin/task-verification-dialog";
import { useStaff } from "@/hooks/use-staff";
import { useTeams } from "@/hooks/use-teams";
import { useTaskProofs } from "@/hooks/use-task-proofs";
import { useTasks } from "@/hooks/use-tasks";
import { format } from "date-fns";

interface TasksTableProps {
  tasks: Task[];
  onDelete: (taskId: string) => void;
}

export function TasksTable({ tasks, onDelete }: TasksTableProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  
  // Get staff and teams data for name resolution
  const { staff } = useStaff();
  const { teams } = useTeams();
  const { proofs } = useTaskProofs();
  const { approveTask, rejectTask } = useTasks();
  
  // Debug: Log staff data when it changes
  useEffect(() => {
    console.log('📋 Staff data loaded:', staff.length, 'staff members');
    if (staff.length > 0) {
      console.log('📋 Staff details:', staff.map(s => ({ id: s.id, name: s.name, profile_image_url: s.profile_image_url })));
    }
  }, [staff]);
  
  // Debug: Log task data when it changes
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('📝 Task data loaded:', tasks.length, 'tasks');
      tasks.forEach(task => {
        console.log(`📝 Task "${task.title}":`, {
          assigned_staff_ids: task.assigned_staff_ids,
          assigned_team_ids: task.assigned_team_ids
        });
        
        // Debug staff lookup for each task
        if (task.assigned_staff_ids?.length > 0) {
          task.assigned_staff_ids.forEach(staffId => {
            const foundStaff = staff.find(s => s.id === staffId);
            console.log(`🔍 Looking for staff ID "${staffId}":`, foundStaff ? `Found: ${foundStaff.name}` : 'NOT FOUND');
          });
        }
      });
    }
  }, [tasks, staff]);

  // Expand tasks with multiple assignments into separate rows
  const expandedTasks = tasks.flatMap(task => {
    const assignments: Array<{ 
      task: Task; 
      assignee: string; 
      assigneeName: string; 
      assigneeImage?: string;
      type: 'staff' | 'team' 
    }> = [];
    
    // Check allocation mode to determine what to display
    if (task.allocation_mode === 'team') {
      // For team tasks, only show team assignments (ignore individual staff)
      if (task.assigned_team_ids?.length > 0) {
        task.assigned_team_ids.forEach(teamId => {
          const team = teams.find(t => t.id === teamId);
          const teamName = team?.name || `Unknown Team (${teamId})`;
          assignments.push({
            task: { ...task, title: `${task.title} - ${teamName}` },
            assignee: teamId,
            assigneeName: teamName,
            type: 'team'
          });
        });
      }
    } else {
      // For individual tasks, only show individual staff assignments
      if (task.assigned_staff_ids?.length > 0) {
        task.assigned_staff_ids.forEach(staffId => {
          const staffMember = staff.find(s => s.id === staffId);
          let staffName: string;
          let staffImage: string | undefined;
          
          if (staffMember) {
            staffName = staffMember.name;
            staffImage = staffMember.profile_image_url || undefined;
          } else {
            // Try to find by email or name if ID doesn't match
            const alternativeStaff = staff.find(s => 
              s.email === staffId ||
              s.name.toLowerCase().includes(staffId.toLowerCase())
            );
            
            if (alternativeStaff) {
              staffName = alternativeStaff.name;
              staffImage = alternativeStaff.profile_image_url || undefined;
            } else {
              // Final fallback - check if it's a mock ID and suggest real staff
              if (staffId.startsWith('staff-')) {
                staffName = `Mock Staff (${staffId}) - Please reassign`;
              } else {
                staffName = `Unknown Staff (${staffId})`;
              }
              staffImage = undefined;
            }
          }
          
          assignments.push({
            task: { ...task, title: `${task.title} - ${staffName}` },
            assignee: staffId,
            assigneeName: staffName,
            assigneeImage: staffImage,
            type: 'staff'
          });
        });
      }
    }
    
    // If no assignments, return the original task
    if (assignments.length === 0) {
      assignments.push({
        task,
        assignee: '',
        assigneeName: 'Unassigned',
        type: 'staff'
      });
    }
    
    return assignments;
  });

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

  // Handle view proofs
  const handleViewProofs = (task: Task) => {
    setSelectedTask(task);
    setIsProofDialogOpen(true);
  };

  // Get proofs for a specific task
  const getTaskProofs = (taskId: string) => {
    return proofs.filter(proof => proof.task_id === taskId);
  };

  // Get pending proofs count for a task
  const getPendingProofsCount = (taskId: string) => {
    return proofs.filter(proof => proof.task_id === taskId && proof.is_verified === null).length;
  };

  // Get assignee info for expanded task
  const getAssigneeInfo = (assigneeName: string, type: 'staff' | 'team', imageUrl?: string) => {
    return {
      name: assigneeName,
      image: imageUrl || null,
      type: type,
    };
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Task #</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expandedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground">No tasks found</p>
                </TableCell>
              </TableRow>
            ) : (
              expandedTasks.map((assignment, index) => {
                const assigneeInfo = getAssigneeInfo(assignment.assigneeName, assignment.type, assignment.assigneeImage);
                return (
                  <TableRow 
                    key={`${assignment.task.id}-${assignment.assignee}-${index}`}
                  >
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-muted-foreground">
                        {assignment.task.task_no || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/tasks/${assignment.task.id}/diagram`)}
                              className="hover:text-primary hover:underline transition-colors text-left"
                            >
                              {assignment.task.title}
                            </button>
                            {assignment.task.is_repeated && (
                              <Repeat className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {assignment.task.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {assignment.task.description}
                            </p>
                          )}
                          {assignment.task.delegated_from_staff_id && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                Delegated from {assignment.task.delegated_by_staff_name || 'Unknown'}
                              </Badge>
                            </div>
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
                                : "Staff"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(assignment.task.status)}>
                        {formatStatus(assignment.task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(assignment.task.priority)}>
                        {formatPriority(assignment.task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.task.due_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(assignment.task.due_date), "MMM dd, yyyy")}
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
                              router.push(`/admin/tasks/${assignment.task.id}/diagram`);
                            }}
                          >
                            <Network className="h-4 w-4 mr-2" />
                            View Diagram
                          </DropdownMenuItem>
                          {getTaskProofs(assignment.task.id).length > 0 && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProofs(assignment.task);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Proofs
                              {getPendingProofsCount(assignment.task.id) > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {getPendingProofsCount(assignment.task.id)}
                                </Badge>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(assignment.task);
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
                            onConfirm={() => onDelete(assignment.task.id)}
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

      {/* Task Verification Dialog */}
      {selectedTask && (
        <TaskVerificationDialog
          task={selectedTask}
          isOpen={isProofDialogOpen}
          onOpenChange={setIsProofDialogOpen}
        />
      )}
    </>
  );
}

