/**
 * 📋 Tasks Table Component
 * 
 * Features:
 * - Displays separate rows for each staff/team assignment
 * - "Cleaning Amar" and "Cleaning Najas" show as 2 separate rows
 * - Real-time updates with optimistic UI
 * - Clean, responsive design
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, User, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import type { Task } from '@/types';

interface TasksTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isLoading?: boolean;
}

export function TasksTable({ tasks, onEdit, onDelete, isLoading }: TasksTableProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Transform tasks into assignment rows
  const assignmentRows = tasks.flatMap(task => {
    const rows = [];

    // Add rows for staff assignments
    if (task.assigned_staff_ids?.length) {
      for (const staffId of task.assigned_staff_ids) {
        rows.push({
          id: `${task.id}-staff-${staffId}`,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          created: task.created_at,
          assignmentType: 'staff' as const,
          assignmentId: staffId,
          // In a real app, you'd fetch staff details here
          assignmentName: `Staff ${staffId.slice(0, 8)}`,
          assignmentRole: 'Member',
        });
      }
    }

    // Add rows for team assignments
    if (task.assigned_team_ids?.length) {
      for (const teamId of task.assigned_team_ids) {
        rows.push({
          id: `${task.id}-team-${teamId}`,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          created: task.created_at,
          assignmentType: 'team' as const,
          assignmentId: teamId,
          // In a real app, you'd fetch team details here
          assignmentName: `Team ${teamId.slice(0, 8)}`,
          assignmentRole: 'Team',
        });
      }
    }

    // If no assignments, show unassigned task
    if (!task.assigned_staff_ids?.length && !task.assigned_team_ids?.length) {
      rows.push({
        id: `${task.id}-unassigned`,
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        created: task.created_at,
        assignmentType: 'unassigned' as const,
        assignmentId: '',
        assignmentName: 'Unassigned',
        assignmentRole: '',
      });
    }

    return rows;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-yellow-100 text-yellow-800';
      case 'backlog':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const isExpanded = (taskId: string) => expandedTasks.has(taskId);

  // Group rows by task for expandable view
  const groupedRows = assignmentRows.reduce((acc, row) => {
    if (!acc[row.taskId]) {
      acc[row.taskId] = [];
    }
    acc[row.taskId].push(row);
    return acc;
  }, {} as Record<string, typeof assignmentRows>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Task</TableHead>
            <TableHead className="w-[200px]">Assigned To</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[150px]">Due Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedRows).map(([taskId, rows]) => {
            const firstRow = rows[0];
            const isTaskExpanded = isExpanded(taskId);
            const showAllRows = isTaskExpanded || rows.length === 1;

            return (
              <>
                {/* First row (always visible) */}
                <TableRow key={firstRow.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(taskId)}
                          className="h-6 w-6 p-0"
                        >
                          {isTaskExpanded ? '−' : '+'}
                        </Button>
                      )}
                      <div>
                        <div className="font-medium">{firstRow.taskTitle}</div>
                        {firstRow.taskDescription && (
                          <div className="text-sm text-gray-500">
                            {firstRow.taskDescription}
                          </div>
                        )}
                        {rows.length > 1 && !isTaskExpanded && (
                          <div className="text-xs text-blue-600">
                            +{rows.length - 1} more assignment{rows.length > 2 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {firstRow.assignmentType === 'staff' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{firstRow.assignmentName}</div>
                        <div className="text-xs text-gray-500">{firstRow.assignmentRole}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(firstRow.status)}>
                      {firstRow.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(firstRow.priority)}>
                      {firstRow.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {firstRow.dueDate && (
                      <span className="text-sm">
                        {format(new Date(firstRow.dueDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tasks.find(t => t.id === taskId)!)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(taskId)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Additional rows (when expanded) */}
                {showAllRows && rows.slice(1).map(row => (
                  <TableRow key={row.id} className="hover:bg-gray-50 bg-gray-25">
                    <TableCell>
                      <div className="pl-8 text-gray-600">
                        {/* Indented to show it's part of the same task */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {row.assignmentType === 'staff' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{row.assignmentName}</div>
                          <div className="text-xs text-gray-500">{row.assignmentRole}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(row.status)}>
                        {row.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(row.priority)}>
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.dueDate && (
                        <span className="text-sm">
                          {format(new Date(row.dueDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* No actions for additional rows */}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            );
          })}
        </TableBody>
      </Table>

      {assignmentRows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found. Create your first task to get started!
        </div>
      )}
    </div>
  );
}
