"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSystemOptions } from "@/hooks/use-system-options";
import { toast } from "sonner";
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
import { Eye, EyeOff, User, Upload, Camera, Mail, Phone, Edit, Save, X, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  password: string;
  role: string;
  branch: string;
  profileImage: string | null;
  phone?: string;
}

export function EmployeeFormPopup() {
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    email: "",
    password: "",
    role: "",
    branch: "",
    phone: "",
  });

  // ============================================
  // SYSTEM OPTIONS: Dynamic roles, departments, branches
  // ============================================
  const { roles, departments, branches } = useSystemOptions();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.employeeName || !formData.employeeId || !formData.email || !formData.password || !formData.role || !formData.branch) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // Check if Supabase is available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Fallback to localStorage
        const newEmployee: Employee = {
          id: Date.now().toString(),
          name: formData.employeeName,
          employeeId: formData.employeeId,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          branch: formData.branch,
          profileImage: profileImage,
          phone: formData.phone || "",
        };

        setEmployees(prev => {
          const updatedEmployees = [...prev, newEmployee];
          localStorage.setItem('employees', JSON.stringify(updatedEmployees));
          return updatedEmployees;
        });

        toast.success("Employee created successfully (local storage)!");
      } else {
        // Use Supabase
        const supabase = createClient();

        // Create employee record
        const employeeData = {
          name: formData.employeeName,
          employee_id: formData.employeeId,
          email: formData.email,
          password: formData.password, // In production, hash this password
          role: formData.role,
          branch: formData.branch,
          phone: formData.phone || null,
          profile_image_url: profileImage,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('staff')
          .insert(employeeData)
          .select()
          .single();

        if (error) throw error;

        // Add to local state for immediate UI update
        const newEmployee: Employee = {
          id: data.id,
          name: formData.employeeName,
          employeeId: formData.employeeId,
          email: formData.email,
          password: '',
          role: formData.role,
          branch: formData.branch,
          profileImage: profileImage,
          phone: formData.phone || "",
        };

        setEmployees(prev => [...prev, newEmployee]);
        toast.success("Employee created successfully!");
      }

      // Reset form
      setFormData({
        employeeName: "",
        employeeId: "",
        email: "",
        password: "",
        role: "",
        branch: "",
        phone: "",
      });
      setProfileImage(null);
      setIsDialogOpen(false);

    } catch (error: unknown) {
      console.error('Error creating employee:', error);
      // Fallback to localStorage on Supabase error
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: formData.employeeName,
        employeeId: formData.employeeId,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        branch: formData.branch,
        profileImage: profileImage,
        phone: formData.phone || "",
      };

      setEmployees(prev => {
        const updatedEmployees = [...prev, newEmployee];
        localStorage.setItem('employees', JSON.stringify(updatedEmployees));
        return updatedEmployees;
      });

      toast.success("Employee created successfully (local storage)!");
      
      // Reset form
      setFormData({
        employeeName: "",
        employeeId: "",
        email: "",
        password: "",
        role: "",
        branch: "",
        phone: "",
      });
      setProfileImage(null);
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditMode(true);
    setFormData({
      employeeName: employee.name,
      employeeId: employee.employeeId,
      email: employee.email,
      password: employee.password,
      role: employee.role,
      branch: employee.branch,
      phone: employee.phone || "",
    });
    setProfileImage(employee.profileImage);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    try {
      const supabase = createClient();

      // Update employee record in Supabase
      const { error } = await supabase
        .from('staff')
        .update({
          name: formData.employeeName,
          employee_id: formData.employeeId,
          email: formData.email,
          role: formData.role,
          branch: formData.branch,
          phone: formData.phone || null,
          profile_image_url: profileImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;

      // Update local state
      const updatedEmployee: Employee = {
        ...editingEmployee,
        name: formData.employeeName,
        employeeId: formData.employeeId,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        branch: formData.branch,
        profileImage: profileImage,
        phone: formData.phone || "",
      };

      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));

      setIsEditMode(false);
      setEditingEmployee(null);
      setFormData({
        employeeName: "",
        employeeId: "",
        email: "",
        password: "",
        role: "",
        branch: "",
        phone: "",
      });
      setProfileImage(null);
      setIsDialogOpen(false);

      toast.success("Employee updated successfully!");
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
      toast.error("Failed to update employee: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingEmployee(null);
    setFormData({
      employeeName: "",
      employeeId: "",
      email: "",
      password: "",
      role: "",
      branch: "",
      phone: "",
    });
    setProfileImage(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const supabase = createClient();

      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('staff')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) throw error;

      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));

      toast.success("Employee deleted successfully!");
    } catch (error: unknown) {
      console.error('Error deleting employee:', error);
      toast.error("Failed to delete employee: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Load employees from Supabase on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Check if Supabase environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not found, using localStorage fallback');
          // Fallback to localStorage if Supabase is not configured
          const storedEmployees = localStorage.getItem('employees');
          if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
          }
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          // If table doesn't exist or other database error, fallback to localStorage
          const storedEmployees = localStorage.getItem('employees');
          if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
            toast.info("Using local data - database not configured yet");
          } else {
            setEmployees([]);
            toast.info("No employees found - add your first employee");
          }
          return;
        }

        // Transform data to match Employee interface
        const transformedEmployees: Employee[] = (data || []).map(emp => ({
          id: emp.id,
          name: emp.name,
          employeeId: emp.employee_id,
          email: emp.email,
          password: '', // Don't expose password in the UI
          role: emp.role,
          branch: emp.branch,
          profileImage: emp.profile_image_url,
          phone: emp.phone || '',
        }));

        setEmployees(transformedEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        // Fallback to localStorage on any error
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
          setEmployees(JSON.parse(storedEmployees));
          toast.info("Using local data - database connection failed");
        } else {
          setEmployees([]);
          toast.info("No employees found - add your first employee");
        }
      }
    };

    fetchEmployees();
  }, []);

  // Dynamic options from database (already fetched via useSystemOptions hook above)

  return (
    <div className="space-y-6">
      {/* Header Section with Title and Button */}
      <div className="flex justify-between items-center">
        {/* Left side - Title and Description */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Employee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team members and their accounts
          </p>
        </div>

        {/* Right side - Add Employee Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setIsEditMode(false);
                setFormData({
                  employeeName: "",
                  employeeId: "",
                  email: "",
                  password: "",
                  role: "",
                  branch: "",
                  phone: "",
                });
                setProfileImage(null);
              }}
            >
            Add New Employee
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] w-[95vw] bg-white dark:bg-gray-950 rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Employee Details" : "Add Employee Details"}
            </DialogTitle>
          </DialogHeader>
          
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Profile Picture Card */}
                <div className="md:col-span-1 flex flex-col items-center space-y-4 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="relative group">
                    <Avatar className="w-28 h-28 border-4 border-white dark:border-gray-800 rounded-2xl shadow-lg">
                      <AvatarImage src={profileImage || ""} className="rounded-2xl object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Camera Icon Overlay */}
                    <Label
                      htmlFor="profile-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </Label>

                    {/* Floating Upload Button */}
                    <Label
                      htmlFor="profile-upload"
                      className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                    >
                      <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </Label>

                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {/* Text Content */}
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Profile Picture
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click camera icon to upload
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      JPG, PNG or GIF (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* Right Column - Form Fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee Name */}
                    <div className="space-y-2">
                      <Label htmlFor="employeeName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Employee Name *
                      </Label>
                      <Input
                        id="employeeName"
                        placeholder="Enter full name"
                        value={formData.employeeName}
                        onChange={(e) => handleInputChange("employeeName", e.target.value)}
                        className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>

                    {/* Employee ID */}
                    <div className="space-y-2">
                      <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Employee ID *
                      </Label>
                      <Input
                        id="employeeId"
                        placeholder="Enter employee ID"
                        value={formData.employeeId}
                        onChange={(e) => handleInputChange("employeeId", e.target.value)}
                        className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email ID *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="w-full pr-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role *
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleInputChange("role", value)}
                      >
                        <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role.toLowerCase().replace(" ", "-")}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Branch Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Branch *
                      </Label>
                      <Select
                        value={formData.branch}
                        onValueChange={(value) => handleInputChange("branch", value)}
                      >
                        <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch.toLowerCase().replace(" ", "-")}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex gap-3">
                    {isEditMode ? (
                      <>
                        <Button
                          onClick={handleUpdate}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Update Employee
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => editingEmployee && handleDelete(editingEmployee.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 text-sm font-semibold"
                      >
                        Create Employee Account
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 group">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-gray-300 dark:border-gray-600 rounded-xl">
                <AvatarImage src={employee.profileImage || ""} className="rounded-xl" />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl">
                  <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {employee.name}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {employee.role}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {employee.employeeId}
                </p>
              </div>
              
              {/* Edit Icon Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(employee)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Edit Employee"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            {/* Contact Info with Icons */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{employee.email}</p>
                </div>
              </div>

              {employee.phone && (
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{employee.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">{employee.branch}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(employee)}
                className="flex-1 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(employee.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <User className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No Employees Added
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Click &quot;Add New Employee&quot; to create your first employee profile.
          </p>
        </div>
      )}
    </div>
  );
}

