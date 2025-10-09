"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  Users,
  Upload,
  X,
} from "lucide-react";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { useOfflineTasks } from "@/hooks/use-offline-tasks";
import { useOfflineStaff } from "@/hooks/use-offline-staff";
import { useOfflineTeams } from "@/hooks/use-offline-teams";
import type { TaskFormData, TaskRepeatConfig, Staff } from "@/types";

interface TaskAllocationDialogProps {
  trigger?: React.ReactNode;
}

export function TaskAllocationDialog({ trigger }: TaskAllocationDialogProps) {
  const { createTask, isCreating } = useOfflineTasks();
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

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isOpen, setIsOpen] = useState(false);
  const [allocationMode, setAllocationMode] = useState<'individual' | 'team'>('individual');
  const [isRepeatedTask, setIsRepeatedTask] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIndividualStaff, setSelectedIndividualStaff] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<Date>();
  const [files, setFiles] = useState<File[]>([]);
  
  // Popover states for calendars
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Repeat settings
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState<Date>();
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // Get team members from selected team
  const selectedTeamData = teams.find(t => t.id === selectedTeam);
  const teamMembersList = selectedTeamData?.members?.map(member => member.staff).filter((staff): staff is Staff => !!staff) || [];
  const loadingTeamMembers = false; // No loading state needed for offline data

  // Reset team members when team changes
  useEffect(() => {
    setSelectedTeamMembers([]);
  }, [selectedTeam]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const handleSelectAll = () => {
    if (selectedTeamMembers.length === teamMembersList.length) {
      setSelectedTeamMembers([]);
    } else {
      setSelectedTeamMembers(teamMembersList.map((m) => m.id));
    }
  };

  const handleMemberSelection = (memberId: string) => {
    setSelectedTeamMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedIndividualStaff("");
    setSelectedTeam("");
    setSelectedTeamMembers([]);
    setPriority('medium');
    setDueDate(undefined);
    setFiles([]);
    setIsRepeatedTask(false);
    setRepeatFrequency('daily');
    setRepeatInterval(1);
    setRepeatEndDate(undefined);
    setCustomDays([]);
    setHasSpecificTime(false);
    setStartTime("09:00");
    setEndTime("17:00");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build repeat config if repeated task
    let repeatConfig: TaskRepeatConfig | undefined;
    if (isRepeatedTask) {
      repeatConfig = {
        frequency: repeatFrequency,
        interval: repeatInterval,
        end_date: repeatEndDate?.toISOString(),
        custom_days: repeatFrequency === 'custom' ? customDays : undefined,
        has_specific_time: hasSpecificTime,
        start_time: hasSpecificTime ? startTime : undefined,
        end_time: hasSpecificTime ? endTime : undefined,
      };
    }

    // Build form data
    const formData: TaskFormData = {
      title,
      description,
      allocation_mode: allocationMode,
      assignee_id: allocationMode === 'individual' ? selectedIndividualStaff : undefined,
      team_id: allocationMode === 'team' ? selectedTeam : undefined,
      assigned_staff_ids: allocationMode === 'team' ? selectedTeamMembers : undefined,
      status: 'todo',
      priority,
      due_date: dueDate?.toISOString(),
      start_date: isRepeatedTask ? dueDate?.toISOString() : undefined,
      is_repeated: isRepeatedTask,
      repeat_config: repeatConfig,
      support_files: files,
    };

    // Convert TaskRepeatConfig to Record<string, unknown> for offline storage
    const taskData = {
      ...formData,
      repeat_config: formData.repeat_config ? (formData.repeat_config as unknown as Record<string, unknown>) : undefined,
      support_files: files?.map(file => file.name) || undefined, // Convert File[] to string[]
    };
    createTask(taskData);
    resetForm();
    setIsOpen(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-64 flex items-center justify-center gap-2">
            <IconCirclePlusFilled className="h-4 w-4" />
            <span>Allocate Tasks</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Task Allocation Form
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
          {/* Allocation Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Allocation Mode *</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant={allocationMode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAllocationMode('individual')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <User className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Individual</span>
                </Button>
                <Button
                  type="button"
                  variant={allocationMode === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAllocationMode('team')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Team</span>
                </Button>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {allocationMode === 'individual'
                  ? 'Assign to single staff'
                  : 'Assign to team members'}
              </div>
            </div>
          </div>

          {/* Task Title with Repeat Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium">Task Title *</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="repeated-task"
                  checked={isRepeatedTask}
                  onCheckedChange={setIsRepeatedTask}
                />
                <Label htmlFor="repeated-task" className="text-sm font-medium cursor-pointer">
                  Repeated Task
                </Label>
              </div>
            </div>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Repeated Task Settings */}
          {isRepeatedTask && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Repeat Settings</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repeat-frequency" className="text-xs font-medium">Frequency</Label>
                  <Select
                    value={repeatFrequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => setRepeatFrequency(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
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
                  <Label htmlFor="repeat-interval" className="text-xs font-medium">Every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="repeat-interval"
                      type="number"
                      min="1"
                      max="365"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {repeatFrequency === 'daily' ? 'day(s)' : 
                       repeatFrequency === 'weekly' ? 'week(s)' : 
                       repeatFrequency === 'monthly' ? 'month(s)' : 'week(s)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repeat-end-date" className="text-xs font-medium">End Date (Optional)</Label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal text-xs", !repeatEndDate && "text-muted-foreground")}
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
                        variant={customDays.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCustomDay(day)}
                        className="text-xs h-8"
                      >
                        {getDayName(day).substring(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing Settings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="specific-time"
                    checked={hasSpecificTime}
                    onCheckedChange={setHasSpecificTime}
                  />
                  <Label htmlFor="specific-time" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Specific Time Range
                  </Label>
                </div>

                {hasSpecificTime && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-xs font-medium">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-xs font-medium">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the task in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          {/* Assignment Fields */}
          <div className="space-y-4">
            {/* Individual Staff Selection */}
            {allocationMode === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="individual-staff" className="text-sm font-medium">Staff Member *</Label>
                <Select
                  value={selectedIndividualStaff}
                  onValueChange={setSelectedIndividualStaff}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center gap-2">
                          <span>{staff.name}</span>
                          <span className="text-xs text-muted-foreground">({staff.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                    {employees.length === 0 && (
                      <SelectItem value="no-staff" disabled>No staff available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Team Selection (only for team mode) */}
            {allocationMode === 'team' && (
              <div className="space-y-2">
                <Label htmlFor="team" className="text-sm font-medium">Team *</Label>
                <Select
                  value={selectedTeam}
                  onValueChange={setSelectedTeam}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                    {teams.length === 0 && (
                      <SelectItem value="no-teams" disabled>No teams available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority and Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority *</Label>
                <Select
                  value={priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setPriority(value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-sm font-medium">
                  {isRepeatedTask ? "Start Date *" : "Due Date *"}
                </Label>
                <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setIsDueDateOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Team Member Selection (only for team mode) */}
            {allocationMode === 'team' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Members</Label>
                <div className="flex flex-col space-y-2">
                  <div className="text-sm border rounded-md p-2 h-10 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {selectedTeamMembers.length > 0
                        ? `${selectedTeamMembers.length} selected`
                        : "Select team first"
                      }
                    </span>
                    {teamMembersList.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 text-xs"
                      >
                        {selectedTeamMembers.length === teamMembersList.length ? "Deselect All" : "Select All"}
                      </Button>
                    )}
                  </div>

                  {loadingTeamMembers && (
                    <div className="text-xs text-muted-foreground">Loading staff...</div>
                  )}

                    {teamMembersList.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {teamMembersList.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`member-${member.id}`}
                            checked={selectedTeamMembers.includes(member.id)}
                            onChange={() => handleMemberSelection(member.id)}
                            className="h-3 w-3 rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`member-${member.id}`}
                            className="text-xs font-normal cursor-pointer flex-1 truncate"
                            title={`${member.name} (${member.role})`}
                          >
                            {member.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTeam && teamMembersList.length === 0 && !loadingTeamMembers && (
                    <div className="text-xs text-muted-foreground p-2 border rounded-md">
                      No staff members in this team
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {allocationMode === 'individual' && selectedIndividualStaff && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded-md">
              Task will be assigned to: {employees.find(s => s.id === selectedIndividualStaff)?.name}
              {isRepeatedTask && ` (repeated ${repeatFrequency}`}
              {isRepeatedTask && repeatFrequency === 'custom' && customDays.length > 0 && 
                ` on ${customDays.map(day => getDayName(day)).join(', ')}`}
              {isRepeatedTask && hasSpecificTime && ` from ${startTime} to ${endTime}`}
              {isRepeatedTask && ')'}
            </div>
          )}

          {allocationMode === 'team' && selectedTeamMembers.length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded-md">
              {selectedTeamMembers.length} staff member{selectedTeamMembers.length !== 1 ? 's' : ''} selected for task assignment
              {isRepeatedTask && ` (repeated ${repeatFrequency}`}
              {isRepeatedTask && repeatFrequency === 'custom' && customDays.length > 0 && 
                ` on ${customDays.map(day => getDayName(day)).join(', ')}`}
              {isRepeatedTask && hasSpecificTime && ` from ${startTime} to ${endTime}`}
              {isRepeatedTask && ')'}
            </div>
          )}

          {/* Support Files */}
          <div className="space-y-2">
            <Label htmlFor="support-files" className="text-sm font-medium">Support Files</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Input type="file" id="support-files" multiple onChange={handleFileUpload} className="hidden" />
              <Label htmlFor="support-files" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <span className="font-medium text-blue-600">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-400">PDF, DOC, PNG, JPG up to 10MB</p>
              </Label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-sm font-medium">Selected Files:</Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 w-full" 
              disabled={isCreating}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 w-full"
              disabled={isCreating || (allocationMode === 'individual' ? !selectedIndividualStaff : selectedTeamMembers.length === 0)}
            >
              {isCreating ? "Creating Task..." :
                isRepeatedTask
                  ? `Create Repeated Task${allocationMode === 'team' && selectedTeamMembers.length > 0 ? ` for ${selectedTeamMembers.length} Staff` : ''}`
                  : allocationMode === 'individual'
                    ? "Assign to Individual Staff"
                    : selectedTeamMembers.length > 0 ? `Allocate to ${selectedTeamMembers.length} Staff` : 'Create Task'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
