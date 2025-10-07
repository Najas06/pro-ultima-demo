"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, UserSearch } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StaffSearchBarProps {
  onSearchChange: (query: string) => void;
  onDepartmentFilter?: (department: string) => void;
  onRoleFilter?: (role: string) => void;
  totalCount?: number;
  filteredCount?: number;
}

export function StaffSearchBar({ 
  onSearchChange, 
  onDepartmentFilter,
  onRoleFilter,
  totalCount = 0,
  filteredCount = 0
}: StaffSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  
  // Debounce search query to avoid too many re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Call parent's search handler when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    onDepartmentFilter?.(value);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    onRoleFilter?.(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedRole("all");
    onSearchChange("");
    onDepartmentFilter?.("all");
    onRoleFilter?.("all");
  };

  const hasActiveFilters = searchQuery !== "" || selectedDepartment !== "all" || selectedRole !== "all";

  const departments = [
    { value: "all", label: "All Departments" },
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "product", label: "Product" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
  ];

  const roles = [
    { value: "all", label: "All Roles" },
    { value: "team-leader", label: "Team Leader" },
    { value: "project-manager", label: "Project Manager" },
    { value: "detailer", label: "Detailer" },
    { value: "admin", label: "Admin" },
    { value: "accountant", label: "Accountant" },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-9 bg-background/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-all text-sm sm:text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex max-sm:flex-col max-sm:items-center gap-2 w-full sm:w-auto">
          <Select value={selectedDepartment} onValueChange={handleDepartmentChange} >
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[160px] md:w-[180px] h-10 sm:h-auto border-2 text-sm sm:text-base">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <SelectValue placeholder="Department" className="text-sm" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value} className="text-sm">
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] md:w-[160px] h-10 sm:h-auto border-2 text-sm sm:text-base">
              <UserSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <SelectValue placeholder="Role" className="text-sm" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value} className="text-sm">
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {hasActiveFilters && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 sm:h-8 text-xs sm:text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
              
              {searchQuery && (
                <Badge variant="secondary" className="text-xs gap-1 py-0.5 px-2">
                  <span className="hidden sm:inline">Search: </span>{searchQuery.length > 10 ? searchQuery.slice(0, 10) + '...' : searchQuery}
                </Badge>
              )}
              
              {selectedDepartment !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1 py-0.5 px-2">
                  <span className="hidden sm:inline">Dept: </span>
                  {departments.find(d => d.value === selectedDepartment)?.label.split(' ')[0]}
                </Badge>
              )}
              
              {selectedRole !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1 py-0.5 px-2">
                  <span className="hidden sm:inline">Role: </span>
                  {roles.find(r => r.value === selectedRole)?.label}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="text-xs sm:text-sm text-muted-foreground order-first sm:order-last">
          {hasActiveFilters ? (
            <span>
              <span className="hidden sm:inline">Showing </span>
              <strong className="text-foreground">{filteredCount}</strong>
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              <strong className="text-foreground">{totalCount}</strong>
              <span className="hidden sm:inline"> employees</span>
            </span>
          ) : (
            <span>
              <strong className="text-foreground">{totalCount}</strong>{" "}
              {totalCount === 1 ? "employee" : "employees"}
              <span className="hidden sm:inline"> total</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


