"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  EyeOff, 
  User, 
  Upload, 
  Camera, 
  Mail, 
  Phone, 
  Edit, 
  Save, 
  X, 
  Trash2,
  Search
} from "lucide-react";
import { useStaff, Employee } from "@/hooks/use-staff";
import { toast } from "sonner";
import { StaffCard } from "./staff-card";
import { StaffCardSkeleton } from "./staff-card-skeleton";
import { StaffSearchBar } from "./staff-search-bar";
import { useMemo } from "react";

export function EmployeeFormOptimized() {
  // ============================================
  // CUSTOM HOOK: All staff operations with optimistic updates
  // ============================================
  const {
    employees,
    isLoading,
    createStaff,
    updateStaff,
    deleteStaff,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStaff();

  // ============================================
  // LOCAL STATE: Form and UI
  // ============================================
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    email: "",
    password: "",
    role: "",
    department: "",
    branch: "",
    phone: "",
  });

  // ============================================
  // SEARCH & FILTER STATE
  // ============================================
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Search filter (name or employee ID)
      const matchesSearch =
        searchQuery === "" ||
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      // Department filter
      const matchesDepartment =
        departmentFilter === "all" || employee.department === departmentFilter;

      // Role filter
      const matchesRole = roleFilter === "all" || employee.role === roleFilter;

      return matchesSearch && matchesDepartment && matchesRole;
    });
  }, [employees, searchQuery, departmentFilter, roleFilter]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.employeeName || !formData.employeeId || !formData.email || 
        !formData.password || !formData.role || !formData.department) {
      toast.error("Please fill all required fields");
      return;
    }

    // Call the hook's createStaff (which has optimistic updates)
    createStaff({
      ...formData,
      profileImage: profileImage || undefined,
    });

    // Reset form after submission
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditMode(true);
    setFormData({
      employeeName: employee.name,
      employeeId: employee.employeeId,
      email: employee.email,
      password: "", // Don't pre-fill password for security
      role: employee.role,
      department: employee.department,
      branch: employee.branch || "",
      phone: employee.phone || "",
    });
    setProfileImage(employee.profileImage);
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingEmployee) return;

    // Call the hook's updateStaff (which has optimistic updates)
    updateStaff({
      ...formData,
      id: editingEmployee.id,
      profileImage: profileImage || undefined,
      oldProfileImageUrl: editingEmployee.profileImage || undefined,
    });

    // Reset after submission
    resetForm();
    setIsEditMode(false);
    setEditingEmployee(null);
    setIsDialogOpen(false);
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsEditMode(false);
    setEditingEmployee(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (employeeId: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    // Call the hook's deleteStaff (which has optimistic updates)
    deleteStaff(employeeId);
  };

  const resetForm = () => {
    setFormData({
      employeeName: "",
      employeeId: "",
      email: "",
      password: "",
      role: "",
      department: "",
      branch: "",
      phone: "",
    });
    setProfileImage(null);
  };

  // ============================================
  // DROPDOWN OPTIONS
  // ============================================
  const roles = [
    { value: "team-leader", label: "Team Leader" },
    { value: "project-manager", label: "Project Manager" },
    { value: "detailer", label: "Detailer" },
    { value: "admin", label: "Admin" },
    { value: "accountant", label: "Accountant" },
  ];

  const departments = [
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "product", label: "Product" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
  ];

  const branches = [
    { value: "salem", label: "Salem" },
    { value: "chennai", label: "Chennai" },
    { value: "salem-elcot", label: "Salem Elcot" },
    { value: "kanchipuram", label: "Kanchipuram" },
    { value: "madurai", label: "Madurai" },
    { value: "rajapalayam", label: "Rajapalayam" },
    { value: "housr", label: "Housr" },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Employee Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your team members and their accounts
          </p>
        </div>

        {/* Add Employee Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className=" text-white w-full sm:w-auto"
              onClick={() => {
                setIsEditMode(false);
                resetForm();
                
              }}
              variant={"default"}
            >
              <User className="w-4 h-4 mr-2 sm:hidden" />
              Add New Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] w-[95vw] md:w-[90vw] lg:w-[600px] bg-white dark:bg-gray-950 rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Employee Details" : "Add Employee Details"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-2 sm:py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Profile Picture Section */}
                <div className="md:col-span-1 flex flex-col items-center space-y-3 sm:space-y-4 p-4 sm:p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white dark:border-gray-800 rounded-2xl shadow-lg">
                      <AvatarImage src={profileImage || ""} className="rounded-2xl object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400" />
                      </AvatarFallback>
                    </Avatar>

                    <Label
                      htmlFor="profile-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </Label>

                    <Label
                      htmlFor="profile-upload"
                      className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full p-1.5 sm:p-2 cursor-pointer shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                    >
                      <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                    </Label>

                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="text-center space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Profile Picture
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Max 5MB
                    </p>
                  </div>
                </div>

                {/* Form Fields Section */}
                <div className="md:col-span-2 space-y-3 sm:space-y-4">
                  {/* Name and Employee ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="employeeName" className="text-sm">Employee Name *</Label>
                      <Input
                        id="employeeName"
                        placeholder="Enter full name"
                        value={formData.employeeName}
                        onChange={(e) => handleInputChange("employeeName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="employeeId" className="text-sm">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        placeholder="Enter employee ID"
                        value={formData.employeeId}
                        onChange={(e) => handleInputChange("employeeId", e.target.value)}
                        disabled={isEditMode}
                      />
                    </div>
                  </div>

                  {/* Email and Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="password" className="text-sm">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Role and Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="role" className="text-sm">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleInputChange("role", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="department" className="text-sm">Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleInputChange("department", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Branch and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="branch" className="text-sm">Branch</Label>
                      <Select
                        value={formData.branch}
                        onValueChange={(value) => handleInputChange("branch", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
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

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {isEditMode ? (
                      <>
                        <Button
                          onClick={handleUpdate}
                          disabled={isUpdating}
                          className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 h-10 sm:h-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isUpdating ? "Updating..." : "Update"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="w-full sm:flex-1 h-10 sm:h-auto"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => editingEmployee && handleDelete(editingEmployee.id)}
                          disabled={isDeleting}
                          className="w-full sm:w-auto h-10 sm:h-auto"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isCreating}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-10 sm:h-auto"
                      >
                        {isCreating ? "Creating..." : "Create Employee"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <StaffSearchBar
        onSearchChange={setSearchQuery}
        onDepartmentFilter={setDepartmentFilter}
        onRoleFilter={setRoleFilter}
        totalCount={employees.length}
        filteredCount={filteredEmployees.length}
      />

      {/* Employee Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <StaffCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEmployees.map((employee) => (
            <StaffCard
              key={employee.id}
              employee={employee}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Empty State - No employees at all */}
      {!isLoading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold">No Employees Found</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1 text-center px-4">
            Click &quot;Add New Employee&quot; to get started.
          </p>
        </div>
      )}

      {/* Empty State - No results from search/filter */}
      {!isLoading && employees.length > 0 && filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold">No Matching Employees</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1 text-center px-4">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
