/**
 * 🎯 Task Management Component
 * 
 * Features:
 * - Complete CRUD operations
 * - Multiple staff/team assignments per task
 * - Separate rows for each assignment (Cleaning Amar, Cleaning Najas)
 * - Real-time UI updates
 * - Perfect Supabase ↔ React Query ↔ IndexedDB sync
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, RefreshCw, Download, Wifi, WifiOff } from 'lucide-react';
import { TasksTable } from './TasksTable';
import { TaskForm } from './TaskForm';
import { useTasks, useAddTask, useUpdateTask, useDeleteTask, useSyncTasks } from '@/hooks/useTasks';
import type { Task, TaskFormData } from '@/types';

export function TaskManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  // Hooks
  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  const addTaskMutation = useAddTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const syncTasksMutation = useSyncTasks();

  // Mock data - in real app, fetch from hooks
  const staff = [
    { id: 'staff-1', name: 'Amar', role: 'Developer' },
    { id: 'staff-2', name: 'Najas', role: 'Designer' },
    { id: 'staff-3', name: 'Shashi', role: 'Manager' },
  ];

  const teams = [
    { id: 'team-1', name: 'Development Team', description: 'Frontend and backend developers' },
    { id: 'team-2', name: 'Design Team', description: 'UI/UX designers' },
    { id: 'team-3', name: 'QA Team', description: 'Quality assurance team' },
  ];

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Back online');
      setIsOnline(true);
      // Auto-sync when coming back online
      syncTasksMutation.mutate();
    };

    const handleOffline = () => {
      console.log('📴 Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncTasksMutation]);

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    incomplete: tasks.filter(t => ['backlog', 'todo'].includes(t.status)).length,
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    await addTaskMutation.mutateAsync(formData);
  };

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        updates: formData,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSync = () => {
    syncTasksMutation.mutate();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error Loading Tasks</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-gray-600">Manage and track all your tasks in one place.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync}>
            Cross-Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync}>
            Online-Sync
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-xs text-gray-500">All tasks in the system</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-xs text-gray-500">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-xs text-gray-500">Currently being worked on</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{stats.incomplete}</div>
          <div className="text-sm text-gray-600">Incomplete</div>
          <div className="text-xs text-gray-500">Backlog and to-do items</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">All Status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <TasksTable
          tasks={filteredTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          isLoading={isLoading}
        />
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        isLoading={addTaskMutation.isPending || updateTaskMutation.isPending}
        staff={staff}
        teams={teams}
      />

      {/* Loading States */}
      {(addTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {addTaskMutation.isPending && 'Creating task...'}
          {updateTaskMutation.isPending && 'Updating task...'}
          {deleteTaskMutation.isPending && 'Deleting task...'}
        </div>
      )}
    </div>
  );
}
