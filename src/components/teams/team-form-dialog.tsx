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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Save, 
  X, 
  Trash2,
  Crown,
  UserPlus
} from "lucide-react";
import { useOfflineStaff } from "@/hooks/use-offline-staff";
import { toast } from "sonner";
import type { Team } from "@/types";

interface TeamFormDialogProps {
  team?: Team | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    leader_id: string;
    branch?: string;
    member_ids: string[];
  }) => void;
  onUpdate?: (data: {
    id: string;
    name: string;
    description?: string;
    leader_id: string;
    branch?: string;
    member_ids: string[];
  }) => void;
  onDelete?: (teamId: string) => void;
  isSubmitting?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function TeamFormDialog({
  team,
  isOpen,
  onOpenChange,
  onSubmit,
  onUpdate,
  onDelete,
  isSubmitting = false,
  isUpdating = false,
  isDeleting = false,
}: TeamFormDialogProps) {
  const { staff } = useOfflineStaff();
  const isEditMode = !!team;

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
  // LOCAL STATE
  // ============================================
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leader_id: "",
    branch: "",
    member_ids: [] as string[],
  });

  // Update form when team changes or dialog opens
  useEffect(() => {
    if (team && isOpen) {
      setFormData({
        name: team.name,
        description: team.description || "",
        leader_id: team.leader_id,
        branch: team.branch || "",
        member_ids: team.members?.map(m => m.staff_id) || [],
      });
    } else if (!team && isOpen) {
      // Reset form for new team
      resetForm();
    }
  }, [team, isOpen]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (field: string, value: string | string[]) => {
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

  const handleSubmitForm = () => {
    // Validate required fields
    if (!formData.name || !formData.leader_id) {
      toast.error("Please fill all required fields (Team name and Leader)");
      return;
    }

    // Remove leader from members if selected
    const finalMemberIds = formData.member_ids.filter(id => id !== formData.leader_id);

    if (isEditMode && onUpdate && team) {
      onUpdate({
        id: team.id,
        ...formData,
        member_ids: finalMemberIds,
      });
    } else {
      onSubmit({
        ...formData,
        member_ids: finalMemberIds,
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const handleDeleteTeam = () => {
    if (!team || !onDelete) return;
    
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    onDelete(team.id);
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      leader_id: "",
      branch: "",
      member_ids: [],
    });
  };

  // ============================================
  // DROPDOWN OPTIONS
  // ============================================
  const branches = [
    { value: "salem", label: "Salem" },
    { value: "chennai", label: "Chennai" },
    { value: "salem-elcot", label: "Salem Elcot" },
    { value: "kanchipuram", label: "Kanchipuram" },
    { value: "madurai", label: "Madurai" },
    { value: "rajapalayam", label: "Rajapalayam" },
    { value: "housr", label: "Housr" },
  ];

  // Available members (excluding the selected leader)
  const availableMembers = useMemo(() => {
    return employees.filter(emp => emp.id !== formData.leader_id);
  }, [employees, formData.leader_id]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] md:w-[90vw] lg:w-[700px] bg-white dark:bg-gray-950 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Team" : "Create New Team"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2 sm:py-4 space-y-4 sm:space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Team Name *</Label>
            <Input
              id="name"
              placeholder="Enter team name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter team description (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Leader and Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leader" className="text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Team Leader *
              </Label>
              <Select
                value={formData.leader_id}
                onValueChange={(value) => handleInputChange("leader_id", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select team leader" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => handleInputChange("branch", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select branch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Members Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              Team Members (Optional)
            </Label>
            
            {availableMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                {formData.leader_id 
                  ? "No other staff members available"
                  : "Please select a team leader first"}
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

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isEditMode ? (
              <>
                <Button
                  onClick={handleSubmitForm}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-10"
                  variant={'default'}
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? "Updating..." : "Update Team"}
                </Button>
                <Button
                  variant={'outline'}
                  onClick={handleCancel}
                  className="w-full sm:flex-1 h-10"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  variant={'destructive'}
                  onClick={handleDeleteTeam}
                  disabled={isDeleting}
                  className="w-full sm:w-auto h-10"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:hidden">Delete Team</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 h-10"
                  variant={'default'}
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  variant={'outline'}
                  onClick={handleCancel}
                  className="w-full sm:flex-1 h-10"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

