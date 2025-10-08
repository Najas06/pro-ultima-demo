"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  Users,
  Save,
  X,
  Trash2,
  Repeat,
  FileText,
  UserPlus,
  Eye,
  Edit as EditIcon,
} from "lucide-react";
import { useTasks, useTeamMembers } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { useTeams } from "@/hooks/use-teams";
import type { Task, TaskRepeatConfig, Staff, TaskStatus, TaskPriority } from "@/types";

interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailsDialog({
  task,
  isOpen,
  onOpenChange,
  onDelete,
}: TaskDetailsDialogProps) {
  const { updateTask, isUpdating, deleteTask, isDeleting } = useTasks();
  const { employees } = useStaff();
  const { teams } = useTeams();

  const [isEditing, setIsEditing] = useState(false);
  
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

  // Fetch team members when team is selected
  const { data: teamMembers, isLoading: loadingTeamMembers } = useTeamMembers(formData.team_id);
  const teamMembersList = (teamMembers || []) as Staff[];

  // Available members
  const availableMembers = teamMembersList;

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
        member_ids: task.assigned_staff?.map(a => a.staff_id) || [],
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
        setStartTime(task.repeat_config.start_time || "09:00");
        setEndTime(task.repeat_config.end_time || "17:00");
      }

      setIsEditing(false);
    }
  }, [task, isOpen]);

  const handleInputChange = (field: string, value: string | boolean | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMember = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(staffId)
        ? prev.member_ids.filter(id => id !== staffId)
        : [...prev.member_ids, staffId],
    }));
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

  const handleSave = () => {
    if (!task) return;

    // Build repeat config if repeated task
    let repeatConfig: TaskRepeatConfig | undefined;
    if (formData.is_repeated) {
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

    updateTask({
      id: task.id,
      title: formData.title,
      description: formData.description,
      allocation_mode: formData.allocation_mode,
      assignee_id: formData.allocation_mode === "individual" ? formData.assignee_id : undefined,
      team_id: formData.allocation_mode === "team" ? formData.team_id : undefined,
      assigned_staff_ids: formData.allocation_mode === "team" ? formData.member_ids : undefined,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date?.toISOString(),
      start_date: formData.is_repeated ? formData.due_date?.toISOString() : undefined,
      is_repeated: formData.is_repeated,
      repeat_config: repeatConfig,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(task.id);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload task data
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        allocation_mode: task.allocation_mode,
        assignee_id: task.assignee_id || "",
        team_id: task.team_id || "",
        member_ids: task.assigned_staff?.map(a => a.staff_id) || [],
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        is_repeated: task.is_repeated,
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] md:w-[90vw] lg:w-[800px] bg-white dark:bg-gray-950 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex border-b pb-4  items-center justify-between">
            <span>{isEditing ? "Edit Task" : "Task Details"}</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mr-4"
              >
                <EditIcon className="h-4 w-4" />
                
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 sm:py-4 space-y-4 sm:space-y-6">
          {/* Allocation Mode (View/Edit) */}
          {isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Allocation Mode *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('allocation_mode', 'individual')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('allocation_mode', 'team')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Team
                </Button>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Task Title *</Label>
            {isEditing ? (
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="h-10"
              />
            ) : (
              <p className="text-base font-semibold">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description || "No description provided"}
              </p>
            )}
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={
                  task.status === "completed" ? "default" :
                  task.status === "in_progress" ? "secondary" :
                  "outline"
                } className="w-fit">
                  {task.status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority *</Label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={
                  task.priority === "urgent" ? "destructive" :
                  task.priority === "high" ? "default" :
                  "secondary"
                } className="w-fit">
                  {task.priority.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {formData.allocation_mode === "individual" ? "Assigned To" : "Team Assignment"}
            </Label>
            
            {isEditing ? (
              <>
                {formData.allocation_mode === "individual" ? (
                  <Select
                    value={formData.assignee_id}
                    onValueChange={(value) => handleInputChange("assignee_id", value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          <div className="flex items-center gap-2">
                            <span>{emp.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {emp.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3">
                    <Select
                      value={formData.team_id}
                      onValueChange={(value) => handleInputChange("team_id", value)}
                    >
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

                    {/* Team Members Selection */}
                    {formData.team_id && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-blue-500" />
                          Team Members (Optional)
                        </Label>
                        
                        {availableMembers.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                            {loadingTeamMembers ? "Loading members..." : "No team members available"}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                            {availableMembers.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors"
                              >
                                <Checkbox
                                  id={`member-${emp.id}`}
                                  checked={formData.member_ids.includes(emp.id)}
                                  onCheckedChange={() => toggleMember(emp.id)}
                                />
                                <label
                                  htmlFor={`member-${emp.id}`}
                                  className="flex-1 flex items-center justify-between cursor-pointer"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{emp.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {emp.role} • {emp.department}
                                    </p>
                                  </div>
                                  {emp.branch && (
                                    <Badge variant="secondary" className="text-xs">
                                      {emp.branch}
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Selected Members Summary */}
                        {formData.member_ids.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 w-full mb-1">
                              Selected: {formData.member_ids.length} member{formData.member_ids.length !== 1 ? 's' : ''}
                            </p>
                            {formData.member_ids.map((memberId) => {
                              const member = employees.find(e => e.id === memberId);
                              return member ? (
                                <Badge key={memberId} variant="secondary" className="text-xs">
                                  {member.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {task.allocation_mode === "individual" ? (
                  <>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{task.assignee?.name || "Unassigned"}</span>
                    {task.assignee && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {task.assignee.role}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{task.team?.name || "No team"}</span>
                    {task.assigned_staff && task.assigned_staff.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {task.assigned_staff.length} members
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-sm font-medium">
              {formData.is_repeated ? "Start Date" : "Due Date"}
            </Label>
            {isEditing ? (
              <Popover>
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
                    onSelect={(date) => handleInputChange("due_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}</span>
              </div>
            )}
          </div>

          {/* Repeated Task Toggle & Settings */}
          {isEditing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-repeated" className="text-sm font-medium">Repeated Task</Label>
                <Switch
                  id="is-repeated"
                  checked={formData.is_repeated}
                  onCheckedChange={(checked) => handleInputChange("is_repeated", checked)}
                />
              </div>

              {formData.is_repeated && (
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
                      <Popover>
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
                            onSelect={setRepeatEndDate}
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
                      <div className="grid grid-cols-2 gap-4">
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
            </div>
          )}

          {/* View Mode: Repeat Task Info */}
          {!isEditing && task.is_repeated && task.repeat_config && (
            <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Repeat Configuration</Label>
              </div>
              <div className="text-sm space-y-1.5 text-blue-900 dark:text-blue-100">
                <p>
                  <span className="font-medium">Frequency:</span>{" "}
                  <span className="capitalize">{task.repeat_config.frequency}</span>
                </p>
                <p>
                  <span className="font-medium">Interval:</span> Every {task.repeat_config.interval}{" "}
                  {task.repeat_config.frequency === "daily" ? "day(s)" : 
                   task.repeat_config.frequency === "weekly" ? "week(s)" : "month(s)"}
                </p>
                {task.repeat_config.end_date && (
                  <p>
                    <span className="font-medium">Ends:</span>{" "}
                    {format(new Date(task.repeat_config.end_date), "PPP")}
                  </p>
                )}
                {task.repeat_config.custom_days && task.repeat_config.custom_days.length > 0 && (
                  <p>
                    <span className="font-medium">Days:</span>{" "}
                    {task.repeat_config.custom_days.map(d => getDayName(d)).join(", ")}
                  </p>
                )}
                {task.repeat_config.has_specific_time && (
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Time:</span>{" "}
                    {task.repeat_config.start_time} - {task.repeat_config.end_time}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Support Files */}
          {!isEditing && task.support_files && task.support_files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Support Files ({task.support_files.length})
              </Label>
              <div className="space-y-2">
                {task.support_files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg border transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Attachment {index + 1}</span>
                    <Eye className="h-3 w-3 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-10"
                  variant="default"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:flex-1 h-10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto h-10"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:hidden ml-2">Delete</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-10"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}