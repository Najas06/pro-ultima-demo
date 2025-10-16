"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addSystemOption, removeSystemOption } from "@/lib/actions/adminActions";
import { useSystemOptions } from "@/hooks/use-system-options";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Briefcase, Building2, MapPin } from "lucide-react";

export function SystemOptionsManager() {
  const { roles, departments, branches, refetch } = useSystemOptions();
  const [loading, setLoading] = useState<string | null>(null);
  const [newValues, setNewValues] = useState({
    role: "",
    department: "",
    branch: "",
  });

  const handleAdd = async (type: 'roles' | 'departments' | 'branches', fieldKey: 'role' | 'department' | 'branch') => {
    const value = newValues[fieldKey].trim();
    if (!value) {
      toast.error("Please enter a value");
      return;
    }

    setLoading(`add-${type}`);

    try {
      const result = await addSystemOption(type, value);

      if (result.success) {
        toast.success(`${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)} added successfully!`);
        setNewValues({ ...newValues, [fieldKey]: "" });
        refetch();
      } else {
        toast.error(result.error || "Failed to add option");
      }
    } catch (error) {
      console.error("Add option error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (type: 'roles' | 'departments' | 'branches', value: string) => {
    if (!confirm(`Are you sure you want to delete "${value}"? This cannot be undone.`)) {
      return;
    }

    setLoading(`remove-${type}-${value}`);

    try {
      const result = await removeSystemOption(type, value);

      if (result.success) {
        toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} removed successfully!`);
        refetch();
      } else {
        toast.error(result.error || "Failed to remove option");
      }
    } catch (error) {
      console.error("Remove option error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Options</CardTitle>
        <CardDescription>
          Manage roles, departments, and branches for staff management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">
              <Briefcase className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Building2 className="h-4 w-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="branches">
              <MapPin className="h-4 w-4 mr-2" />
              Branches
            </TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-role" className="sr-only">
                  Add new role
                </Label>
                <Input
                  id="new-role"
                  placeholder="Enter new role..."
                  value={newValues.role}
                  onChange={(e) => setNewValues({ ...newValues, role: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd('roles', 'role');
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleAdd('roles', 'role')}
                disabled={loading === 'add-roles'}
              >
                {loading === 'add-roles' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles added yet</p>
              ) : (
                roles.map((role) => (
                  <Badge key={role} variant="secondary" className="px-3 py-1.5 text-sm">
                    {role}
                    <button
                      onClick={() => handleRemove('roles', role)}
                      disabled={loading === `remove-roles-${role}`}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      {loading === `remove-roles-${role}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-department" className="sr-only">
                  Add new department
                </Label>
                <Input
                  id="new-department"
                  placeholder="Enter new department..."
                  value={newValues.department}
                  onChange={(e) => setNewValues({ ...newValues, department: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd('departments', 'department');
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleAdd('departments', 'department')}
                disabled={loading === 'add-departments'}
              >
                {loading === 'add-departments' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments added yet</p>
              ) : (
                departments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="px-3 py-1.5 text-sm">
                    {dept}
                    <button
                      onClick={() => handleRemove('departments', dept)}
                      disabled={loading === `remove-departments-${dept}`}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      {loading === `remove-departments-${dept}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-branch" className="sr-only">
                  Add new branch
                </Label>
                <Input
                  id="new-branch"
                  placeholder="Enter new branch..."
                  value={newValues.branch}
                  onChange={(e) => setNewValues({ ...newValues, branch: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd('branches', 'branch');
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleAdd('branches', 'branch')}
                disabled={loading === 'add-branches'}
              >
                {loading === 'add-branches' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No branches added yet</p>
              ) : (
                branches.map((branch) => (
                  <Badge key={branch} variant="secondary" className="px-3 py-1.5 text-sm">
                    {branch}
                    <button
                      onClick={() => handleRemove('branches', branch)}
                      disabled={loading === `remove-branches-${branch}`}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      {loading === `remove-branches-${branch}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

