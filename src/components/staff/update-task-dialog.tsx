'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useTaskProofs } from '@/hooks/use-task-proofs';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskProofUpload } from './task-proof-upload';
import type { Task, TaskStatus } from '@/types';

interface UpdateTaskDialogProps {
  task: Task;
}

export function UpdateTaskDialog({ task }: UpdateTaskDialogProps) {
  const { user } = useAuth();
  const { updateTask } = useTasks();
  const { uploadProofImage, createProof } = useTaskProofs();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [withProof, setWithProof] = useState(false);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === task.status && !withProof) {
      toast.info('No changes to save');
      return;
    }

    if (withProof && !proofImage) {
      toast.error('Please upload a proof image');
      return;
    }

    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload proof image if provided
      let proofImageUrl = '';
      if (withProof && proofImage) {
        setIsUploadingProof(true);
        proofImageUrl = await uploadProofImage(proofImage, task.id);
        setIsUploadingProof(false);
      }

      // Update task status
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

      // Create proof record if image was uploaded
      if (withProof && proofImageUrl) {
        createProof({
          task_id: task.id,
          staff_id: user.staffId,
          status,
          proof_image_url: proofImageUrl,
          notes: proofNotes || undefined,
        });
      }
      
      // Trigger real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      const message = withProof 
        ? 'Task updated with proof! Awaiting admin verification.'
        : 'Task status updated successfully!';
      toast.success(message);
      setOpen(false);
      
      // Reset form
      setWithProof(false);
      setProofImage(null);
      setProofNotes('');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

          {/* Add proof option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-proof"
              checked={withProof}
              onCheckedChange={(checked) => setWithProof(checked as boolean)}
            />
            <Label
              htmlFor="with-proof"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Upload proof image for this update
            </Label>
          </div>

          {/* Proof upload section */}
          {withProof && (
            <TaskProofUpload
              onImageSelect={setProofImage}
              onNotesChange={setProofNotes}
              isUploading={isUploadingProof}
            />
          )}

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
            <Button type="submit" disabled={isSubmitting || (status === task.status && !withProof) || (withProof && !proofImage)}>
              {isSubmitting || isUploadingProof ? (
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

