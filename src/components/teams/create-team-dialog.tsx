"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { TeamFormData, Staff } from "@/types";
import { IconUsers, IconUserCheck } from "@tabler/icons-react";

const teamFormSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  captain_id: z.string().min(1, {
    message: "Please select a team captain.",
  }),
  staff_ids: z.array(z.string()).min(1, {
    message: "Please select at least one team member.",
  }),
});

// Mock staff data for demonstration
const mockStaff: Staff[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@company.com",
    role: "developer",
    department: "engineering",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    role: "manager",
    department: "product",
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    role: "designer",
    department: "design",
    created_at: "2024-01-17T10:00:00Z",
    updated_at: "2024-01-17T10:00:00Z",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    role: "analyst",
    department: "marketing",
    created_at: "2024-01-18T10:00:00Z",
    updated_at: "2024-01-18T10:00:00Z",
  },
  {
    id: "5",
    name: "Alex Brown",
    email: "alex.brown@company.com",
    role: "developer",
    department: "engineering",
    created_at: "2024-01-19T10:00:00Z",
    updated_at: "2024-01-19T10:00:00Z",
  },
];

interface CreateTeamDialogProps {
  mode: "create" | "edit";
  teamId?: string;
  initialData?: Partial<TeamFormData>;
}

export function CreateTeamDialog({ mode, teamId, initialData }: CreateTeamDialogProps) {
  const { teamDialog, closeTeamDialog } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>(initialData?.staff_ids || []);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      captain_id: initialData?.captain_id || "",
      staff_ids: initialData?.staff_ids || [],
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement server action for create/update team
      console.log("Team data:", data);
      console.log("Mode:", mode);
      console.log("Team ID:", teamId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dialog on success
      closeTeamDialog();
      form.reset();
      setSelectedStaff([]);
    } catch (error) {
      console.error("Error submitting team form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeTeamDialog();
    form.reset();
    setSelectedStaff([]);
  };

  const handleStaffToggle = (staffId: string, checked: boolean) => {
    const newSelectedStaff = checked
      ? [...selectedStaff, staffId]
      : selectedStaff.filter(id => id !== staffId);
    
    setSelectedStaff(newSelectedStaff);
    form.setValue("staff_ids", newSelectedStaff);
  };

  const handleCaptainChange = (captainId: string) => {
    form.setValue("captain_id", captainId);
    
    // Ensure captain is also selected as a team member
    if (!selectedStaff.includes(captainId)) {
      const newSelectedStaff = [...selectedStaff, captainId];
      setSelectedStaff(newSelectedStaff);
      form.setValue("staff_ids", newSelectedStaff);
    }
  };

  const availableCaptains = mockStaff.filter(staff => selectedStaff.includes(staff.id));

  return (
    <Dialog open={teamDialog.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            {mode === "create" ? "Create New Team" : "Edit Team"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new team and assign staff members with a captain."
              : "Update the team information and member assignments."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormLabel>Select Team Members</FormLabel>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Staff</CardTitle>
                  <CardDescription>
                    Select staff members to join this team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={staff.id}
                        checked={selectedStaff.includes(staff.id)}
                        onCheckedChange={(checked) => 
                          handleStaffToggle(staff.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={staff.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {staff.name}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {staff.email} • {staff.role} • {staff.department}
                        </p>
                      </div>
                      {selectedStaff.includes(staff.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <FormField
              control={form.control}
              name="captain_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <IconUserCheck className="h-4 w-4" />
                    Team Captain
                  </FormLabel>
                  <Select 
                    onValueChange={handleCaptainChange} 
                    defaultValue={field.value}
                    disabled={availableCaptains.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            availableCaptains.length === 0 
                              ? "Select team members first" 
                              : "Select a team captain"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCaptains.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{staff.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {staff.role} • {staff.department}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {availableCaptains.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Only selected team members can be chosen as captain.
                    </p>
                  )}
                </FormItem>
              )}
            />
            
            {selectedStaff.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Team Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Team Members:</span>
                      <Badge variant="outline">{selectedStaff.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Captain:</span>
                      <span className="text-muted-foreground">
                        {form.watch("captain_id") 
                          ? mockStaff.find(s => s.id === form.watch("captain_id"))?.name 
                          : "Not selected"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (mode === "create" ? "Creating..." : "Updating...") 
                  : (mode === "create" ? "Create Team" : "Update Team")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
