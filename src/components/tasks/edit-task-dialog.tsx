"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  User,
  Users,
  Save,
  Repeat,
} from "lucide-react";
import { useOfflineTasks } from "@/hooks/use-offline-tasks";
import { useOfflineStaff } from "@/hooks/use-offline-staff";
import { useOfflineTeams } from "@/hooks/use-offline-teams";
import type { Task, TaskRepeatConfig, Staff, TaskStatus, TaskPriority } from "@/types";

interface EditTaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({
  task,
  isOpen,
  onOpenChange,
}: EditTaskDialogProps) {
  const { updateTask, isUpdating } = useOfflineTasks();
  const { staff } = useOfflineStaff();
  const { teams } = useOfflineTeams();

  // Transform staff to match expected interface
  const employees = staff.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    department: s.department,
    branch: s.branch,
    phone: s.phone,
    profile_image_url: s.profile_image_url,
  }));

  // Popover states for calendars
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    allocation_mode: "individual" as "individual" | "team",
    assignee_id: "",
    team_id: "",
    member_ids: [] as string[],
    due_date: undefined as Date | undefined,
    is_repeated: false,
  });

  // Repeat settings
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState<Date>();
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // Get team members from selected team
  const selectedTeamData = teams.find(t => t.id === formData.team_id);
  const teamMembersList = selectedTeamData?.members?.map(member => member.staff).filter((staff): staff is Staff => !!staff) || [];

  // Auto-select ALL team members when team changes
  useEffect(() => {
    if (formData.team_id && teamMembersList.length > 0) {
      setFormData(prev => ({ ...prev, member_ids: teamMembersList.map(m => m.id) }));
    }
  }, [formData.team_id, teamMembersList.length]);

  // Load task data when dialog opens
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        allocation_mode: task.allocation_mode,
        assignee_id: task.assignee_id || "",
        team_id: task.team_id || "",
        member_ids: task.team_id && selectedTeamData ? teamMembersList.map(m => m.id) : [],
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        is_repeated: task.is_repeated,
      });

      // Load repeat config
      if (task.repeat_config) {
        setRepeatFrequency(task.repeat_config.frequency);
        setRepeatInterval(task.repeat_config.interval);
        setRepeatEndDate(task.repeat_config.end_date ? new Date(task.repeat_config.end_date) : undefined);
        setCustomDays(task.repeat_config.custom_days || []);
        setHasSpecificTime(task.repeat_config.has_specific_time);
        if (task.repeat_config.has_specific_time && task.repeat_config.start_time && task.repeat_config.end_time) {
          setStartTime(task.repeat_config.start_time);
          setEndTime(task.repeat_config.end_time);
        }
      }
    }
  }, [task, isOpen]);

  const handleInputChange = (field: string, value: string | Date | boolean | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!task) return;

    const repeatConfig: TaskRepeatConfig | undefined = formData.is_repeated ? {
      frequency: repeatFrequency,
      interval: repeatInterval,
      end_date: repeatEndDate?.toISOString(),
      custom_days: repeatFrequency === 'custom' ? customDays : undefined,
      has_specific_time: hasSpecificTime,
      start_time: hasSpecificTime ? startTime : undefined,
      end_time: hasSpecificTime ? endTime : undefined,
    } : undefined;

    await updateTask({
      id: task.id,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date?.toISOString(),
      is_repeated: formData.is_repeated,
      repeat_config: repeatConfig ? (repeatConfig as unknown as Record<string, unknown>) : undefined,
      assignee_id: formData.allocation_mode === 'individual' ? formData.assignee_id : undefined,
      team_id: formData.allocation_mode === 'team' ? formData.team_id : undefined,
      assigned_staff_ids: formData.allocation_mode === 'team' ? formData.member_ids : undefined,
    });

    onOpenChange(false);
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!task) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Task</DrawerTitle>
          <DrawerDescription>
            Update task details and assignment
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Add task description..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="h-10">
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

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger className="h-10">
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

            {/* Allocation Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Assignment Type</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'individual' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('allocation_mode', 'individual')}
                  className="flex-1 h-10"
                >
                  <User className="mr-2 h-4 w-4" />
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'team' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('allocation_mode', 'team')}
                  className="flex-1 h-10"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </div>
            </div>

            {/* Individual Assignment */}
            {formData.allocation_mode === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-sm font-medium">
                  Assign To *
                </Label>
                <Select value={formData.assignee_id} onValueChange={(value) => handleInputChange("assignee_id", value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Team Assignment */}
            {formData.allocation_mode === 'team' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-sm font-medium">
                    Select Team *
                  </Label>
                  <Select value={formData.team_id} onValueChange={(value) => handleInputChange("team_id", value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due-date" className="text-sm font-medium">
                {formData.is_repeated ? "Start Date *" : "Due Date *"}
              </Label>
              <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left h-10", !formData.due_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => {
                      handleInputChange("due_date", date);
                      setIsDueDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Repeat Task Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="repeat-task" className="text-sm font-medium">
                  Repeat Task
                </Label>
                <p className="text-xs text-muted-foreground">
                  Set up recurring task schedule
                </p>
              </div>
              <Switch
                id="repeat-task"
                checked={formData.is_repeated}
                onCheckedChange={(checked) => handleInputChange("is_repeated", checked)}
              />
            </div>

            {/* Repeat Settings */}
            {formData.is_repeated && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Repeat className="h-4 w-4" />
                  Repeat Configuration
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Frequency</Label>
                    <Select value={repeatFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => setRepeatFrequency(value)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Every {repeatFrequency === 'daily' ? 'day(s)' : repeatFrequency === 'monthly' ? 'month(s)' : 'week(s)'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">End Date (Optional)</Label>
                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("w-full justify-start text-left h-9 text-xs", !repeatEndDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {repeatEndDate ? format(repeatEndDate, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={repeatEndDate}
                          onSelect={(date) => {
                            setRepeatEndDate(date);
                            setIsEndDateOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Custom Days Selection */}
                {repeatFrequency === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Select Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={customDays.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleCustomDay(day)}
                          className="h-8 w-12 text-xs"
                        >
                          {dayNames[day]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Time */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Specific Time</Label>
                    <Switch
                      checked={hasSpecificTime}
                      onCheckedChange={setHasSpecificTime}
                    />
                  </div>
                  {hasSpecificTime && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} disabled={isUpdating} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

