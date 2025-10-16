"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  MoreVertical,
  Briefcase,
  Building2,
  Shield,
  Star
} from "lucide-react";
// Employee type is defined inline in employee-form-optimized.tsx
// Using a compatible interface here
interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string; // Required, not optional
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage: string | null; // Can be null but not undefined
  is_online?: boolean; // Online/offline status
}
import Link from "next/link";

interface StaffCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  isDeleting?: boolean;
}

const getRoleBadgeColor = (role: string) => {
  const roleMap: Record<string, string> = {
    "admin": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200",
    "project-manager": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200",
    "team-leader": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200",
    "developer": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200",
    "designer": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200",
    "detailer": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200",
    "accountant": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200",
  };
  return roleMap[role] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200";
};

const getDepartmentIcon = (department: string) => {
  const iconMap: Record<string, typeof Briefcase> = {
    "engineering": Briefcase,
    "design": Star,
    "product": Building2,
    "marketing": Star,
    "finance": Shield,
  };
  return iconMap[department] || Briefcase;
};

const formatRole = (role: string) => {
  return role.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const formatBranch = (branch: string) => {
  return branch.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function StaffCard({ employee, onEdit, onDelete, isDeleting }: StaffCardProps) {
  const DepartmentIcon = getDepartmentIcon(employee.department);

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/20">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Card Header with Actions */}
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture with Status Ring */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
              <Avatar className="relative w-16 h-16 border-4 border-background rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110">
                <AvatarImage src={employee.profileImage || ""} className="rounded-2xl object-cover" alt={employee.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl text-lg font-semibold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              {/* Online Status Indicator */}
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-background rounded-full ${
                  employee.is_online 
                    ? 'bg-green-500' 
                    : 'bg-gray-400 dark:bg-gray-600'
                }`}
                title={employee.is_online ? 'Online' : 'Offline'}
              />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate mb-1 group-hover:text-primary transition-colors">
                {employee.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                  {formatRole(employee.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="z-10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(employee)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(employee.id)} 
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Employee ID Badge */}
        <div className="mt-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-mono font-medium text-muted-foreground">
              ID: {employee.employeeId}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Card Content - Contact Information */}
      <CardContent className="relative space-y-3 pb-4">
        {/* Email */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent border border-blue-100/50 dark:border-blue-900/30 transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
            <Link href={`mailto:${employee.email}`} className="text-sm font-medium truncate text-foreground">{employee.email}</Link>
          </div>
        </div>

        {/* Phone */}
        {employee.phone && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent border border-green-100/50 dark:border-green-900/30 transition-all duration-200 hover:border-green-200 dark:hover:border-green-800">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
              <Link href={`tel:${employee.phone}`} className="text-sm font-medium text-foreground">{employee.phone}</Link>
            </div>
          </div>
        )}

        {/* Department & Branch */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent border border-purple-100/50 dark:border-purple-900/30">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <DepartmentIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dept</p>
              <p className="text-sm font-medium capitalize truncate text-foreground">
                {employee.department}
              </p>
            </div>
          </div>

          {employee.branch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent border border-orange-100/50 dark:border-orange-900/30">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Branch</p>
                <p className="text-sm font-medium capitalize truncate text-foreground">
                  {formatBranch(employee.branch)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Card Footer - Action Buttons */}
      <CardFooter className="relative pt-4 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(employee)}
          className="flex-1 group/btn hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 transition-all duration-200"
        >
          <Edit className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(employee.id)}
          disabled={isDeleting}
          className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 hover:border-red-300 dark:border-red-800 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>

      {/* Decorative Corner Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
}

