/**
 * 📝 Task Form Component
 * 
 * Features:
 * - Create/Edit tasks with multiple staff and team assignments
 * - Clean form validation
 * - Real-time form state management
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { Task, TaskFormData } from '@/types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  isLoading?: boolean;
  staff: Array<{ id: string; name: string; role: string }>;
  teams: Array<{ id: string; name: string; description?: string }>;
}

export function TaskForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  isLoading = false,
  staff,
  teams 
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    allocation_mode: 'individual',
    assigned_staff_ids: [],
    assigned_team_ids: [],
    status: 'todo',
    priority: 'medium',
    due_date: undefined,
    start_date: undefined,
    is_repeated: false,
    repeat_config: undefined,
    support_files: [],
  });

  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode
        setFormData({
          title: task.title,
          description: task.description || '',
          allocation_mode: task.allocation_mode,
          assigned_staff_ids: task.assigned_staff_ids,
          assigned_team_ids: task.assigned_team_ids,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          start_date: task.start_date,
          is_repeated: task.is_repeated,
          repeat_config: task.repeat_config,
          support_files: [],
        });
        setSelectedStaff(task.assigned_staff_ids || []);
        setSelectedTeams(task.assigned_team_ids || []);
      } else {
        // Create mode
        setFormData({
          title: '',
          description: '',
          allocation_mode: 'individual',
          assigned_staff_ids: [],
          assigned_team_ids: [],
          status: 'todo',
          priority: 'medium',
          due_date: undefined,
          start_date: undefined,
          is_repeated: false,
          repeat_config: undefined,
          support_files: [],
        });
        setSelectedStaff([]);
        setSelectedTeams([]);
      }
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (selectedStaff.length === 0 && selectedTeams.length === 0) {
      alert('Please assign at least one staff member or team');
      return;
    }

    // Update form data with selected assignments
    const submitData: TaskFormData = {
      ...formData,
      assigned_staff_ids: selectedStaff,
      assigned_team_ids: selectedTeams,
      allocation_mode: selectedTeams.length > 0 ? 'team' : 'individual',
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Failed to submit task:', error);
    }
  };

  const addStaff = (staffId: string) => {
    if (!selectedStaff.includes(staffId)) {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };

  const removeStaff = (staffId: string) => {
    setSelectedStaff(selectedStaff.filter(id => id !== staffId));
  };

  const addTeam = (teamId: string) => {
    if (!selectedTeams.includes(teamId)) {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const removeTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter(id => id !== teamId));
  };

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.name || 'Unknown Staff';
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>

          {/* Staff Assignments */}
          <div className="space-y-2">
            <Label>Assign Staff</Label>
            <div className="space-y-2">
              <Select onValueChange={addStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Staff */}
              <div className="flex flex-wrap gap-2">
                {selectedStaff.map((staffId) => (
                  <Badge key={staffId} variant="secondary" className="flex items-center gap-1">
                    {getStaffName(staffId)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeStaff(staffId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Team Assignments */}
          <div className="space-y-2">
            <Label>Assign Teams</Label>
            <div className="space-y-2">
              <Select onValueChange={addTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Teams */}
              <div className="flex flex-wrap gap-2">
                {selectedTeams.map((teamId) => (
                  <Badge key={teamId} variant="secondary" className="flex items-center gap-1">
                    {getTeamName(teamId)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTeam(teamId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'backlog' | 'todo' | 'in_progress' | 'completed' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {formData.due_date ? (
                    format(new Date(formData.due_date), 'PPP')
                  ) : (
                    'Select due date...'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ 
                      ...formData, 
                      due_date: date ? date.toISOString() : undefined 
                    });
                    setDueDateOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {formData.start_date ? (
                    format(new Date(formData.start_date), 'PPP')
                  ) : (
                    'Select start date...'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? new Date(formData.start_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ 
                      ...formData, 
                      start_date: date ? date.toISOString() : undefined 
                    });
                    setStartDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
