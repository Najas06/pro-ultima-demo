'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskStatus } from '@/types';

interface UpdateTaskDialogProps {
  task: Task;
}

export function UpdateTaskDialog({ task }: UpdateTaskDialogProps) {
  const { updateTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === task.status) {
      toast.info('No changes to save');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask({
        id: task.id,
        title: task.title,
        description: task.description,
        allocation_mode: task.allocation_mode,
        status,
        priority: task.priority,
        due_date: task.due_date,
        start_date: task.start_date,
        is_repeated: task.is_repeated,
        repeat_config: task.repeat_config,
        assigned_staff_ids: task.assigned_staff_ids,
        assigned_team_ids: task.assigned_team_ids,
      });
      
      // Trigger real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      toast.success('Task status updated successfully! Changes will appear in real-time.');
      setOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-3 w-3 mr-1" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            Change the status of &quot;{task.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show current details */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            <div>
              <span className="font-medium">Current Status:</span>{' '}
              <span className="capitalize">{task.status.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="font-medium">Priority:</span>{' '}
              <span className="capitalize">{task.priority}</span>
            </div>
            {task.due_date && (
              <div>
                <span className="font-medium">Due Date:</span>{' '}
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || status === task.status}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

