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
import { useUIStore } from "@/stores/ui-store";
import { StaffFormData } from "@/types";

const staffFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
  department: z.string().min(1, {
    message: "Please select a department.",
  }),
});

const roles = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "analyst", label: "Analyst" },
  { value: "tester", label: "Tester" },
  { value: "intern", label: "Intern" },
];

const departments = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
];

interface StaffFormDialogProps {
  mode: "create" | "edit";
  staffId?: string;
  initialData?: Partial<StaffFormData>;
}

export function StaffFormDialog({ mode, staffId, initialData }: StaffFormDialogProps) {
  const { staffDialog, closeStaffDialog } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "",
      department: initialData?.department || "",
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement server action for create/update staff
      console.log("Staff data:", data);
      console.log("Mode:", mode);
      console.log("Staff ID:", staffId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dialog on success
      closeStaffDialog();
      form.reset();
    } catch (error) {
      console.error("Error submitting staff form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeStaffDialog();
    form.reset();
  };

  return (
    <Dialog open={staffDialog.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Staff Member" : "Edit Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new staff member to your organization."
              : "Update the staff member's information."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  ? (mode === "create" ? "Adding..." : "Updating...") 
                  : (mode === "create" ? "Add Staff" : "Update Staff")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

