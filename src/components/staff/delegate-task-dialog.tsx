'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/types';

interface DelegateTaskDialogProps {
  task: Task;
  availableStaff: Array<{ id: string; name: string; email: string; department: string }>;
}

export function DelegateTaskDialog({ task, availableStaff }: DelegateTaskDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const [open, setOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out current user and already assigned staff
  const availableForDelegation = availableStaff.filter(
    s => s.id !== user?.staffId && !task.assigned_staff_ids?.includes(s.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create delegation record
      const { error: delegationError } = await supabase
        .from('task_delegations')
        .insert({
          task_id: task.id,
          from_staff_id: user?.staffId,
          to_staff_id: selectedStaffId,
          notes: notes || null,
        });

      if (delegationError) throw delegationError;

      // 2. Add new staff to task's assigned_staff_ids
      const currentAssignedStaff = task.assigned_staff_ids || [];
      const updatedAssignedStaff = [...currentAssignedStaff, selectedStaffId];

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ assigned_staff_ids: updatedAssignedStaff })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // 3. Send email notification (call API route)
      try {
        await fetch('/api/email/send-task-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            staffId: selectedStaffId,
            type: 'delegation',
            delegatedBy: user?.name,
          }),
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole operation if email fails
      }

      // 4. Notify admin about delegation
      try {
        const { data: adminData } = await supabase
          .from('admins')
          .select('email')
          .limit(1)
          .single();

        if (adminData) {
          await fetch('/api/email/send-task-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              staffId: selectedStaffId,
              type: 'delegation_admin_notify',
              delegatedBy: user?.name,
              adminEmail: adminData.email,
            }),
          });
        }
      } catch (adminEmailError) {
        console.error('Admin email notification failed:', adminEmailError);
        // Don't fail the whole operation if admin email fails
      }

      // 5. Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // 6. Trigger real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      toast.success('Task delegated successfully! Changes will appear in real-time.');
      setOpen(false);
      setSelectedStaffId('');
      setNotes('');
    } catch (error) {
      console.error('Error delegating task:', error);
      toast.error('Failed to delegate task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserPlus className="h-3 w-3 mr-1" />
          Delegate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delegate Task</DialogTitle>
          <DialogDescription>
            Assign this task to another team member. Both you and the delegated member will remain assigned.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger id="staff">
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent>
                {availableForDelegation.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No staff members available for delegation
                  </div>
                ) : (
                  availableForDelegation.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.department}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Delegation Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any context or instructions for the delegated staff member..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Task Info */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <div className="text-muted-foreground">{task.description}</div>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Priority: {task.priority}</span>
              <span>Status: {task.status.replace('_', ' ')}</span>
            </div>
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
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedStaffId || availableForDelegation.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Delegating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Delegate Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

