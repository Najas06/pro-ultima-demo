"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team, UpdateTeamFormData } from "@/types";
import { useOfflineTeams } from "@/hooks/use-offline-teams";
import { useOfflineStaff } from "@/hooks/use-offline-staff";
import type { Staff } from "@/types";

interface EditTeamDialogProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function EditTeamDialog({ team, isOpen, onClose }: EditTeamDialogProps) {
  const { updateTeam, isUpdating } = useOfflineTeams();
  const { staff } = useOfflineStaff();
  
  const [formData, setFormData] = useState({
    name: team.name || "",
    description: team.description || "",
    leader_id: team.leader_id || "",
    branch: team.branch || "",
    members: team.members?.map(m => m.staff_id) || [],
  });

  const [leaderOpen, setLeaderOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  // Reset form when team changes
  useEffect(() => {
    setFormData({
      name: team.name || "",
      description: team.description || "",
      leader_id: team.leader_id || "",
      branch: team.branch || "",
      members: team.members?.map(m => m.staff_id) || [],
    });
  }, [team]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const updateData: UpdateTeamFormData = {
      id: team.id,
      name: formData.name,
      description: formData.description,
      leader_id: formData.leader_id,
      branch: formData.branch,
      member_ids: formData.members,
    };

    updateTeam(updateData);

    onClose();
  };

  const selectedLeader = staff.find(s => s.id === formData.leader_id);
  const selectedMembers = staff.filter(s => formData.members.includes(s.id));

  const availableStaff = staff.filter(s => s.id !== formData.leader_id);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-xl sm:text-2xl font-bold">
            Edit Team
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm font-medium">
              Team Name *
            </Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter team name"
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter team description"
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Team Leader */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Team Leader *</Label>
            <Popover open={leaderOpen} onOpenChange={setLeaderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={leaderOpen}
                  className="w-full justify-between"
                >
                  {selectedLeader ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedLeader.profile_image_url || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(selectedLeader.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedLeader.name}</span>
                      <span className="text-muted-foreground">({selectedLeader.role})</span>
                    </div>
                  ) : (
                    "Select team leader..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search staff..." />
                  <CommandEmpty>No staff found.</CommandEmpty>
                  <CommandGroup>
                    {staff.map((staff) => (
                      <CommandItem
                        key={staff.id}
                        value={staff.name}
                        onSelect={() => {
                          handleInputChange("leader_id", staff.id);
                          setLeaderOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.leader_id === staff.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={staff.profile_image_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(staff.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">{staff.role}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch" className="text-sm font-medium">
              Branch
            </Label>
            <Select
              value={formData.branch}
              onValueChange={(value) => handleInputChange("branch", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chennai">Chennai</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="kolkata">Kolkata</SelectItem>
                <SelectItem value="hyderabad">Hyderabad</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
                <SelectItem value="salem">Salem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Team Members</Label>
            <Popover open={membersOpen} onOpenChange={setMembersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={membersOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {selectedMembers.length > 0 
                        ? `${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''} selected`
                        : "Select team members..."
                      }
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search staff..." />
                  <CommandEmpty>No staff found.</CommandEmpty>
                  <CommandGroup>
                    {availableStaff.map((staff) => {
                      const isSelected = formData.members.includes(staff.id);
                      return (
                        <CommandItem
                          key={staff.id}
                          value={staff.name}
                          onSelect={() => {
                            const newMembers = isSelected
                              ? formData.members.filter(id => id !== staff.id)
                              : [...formData.members, staff.id];
                            handleInputChange("members", newMembers);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={staff.profile_image_url || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(staff.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-muted-foreground">{staff.role}</div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Members Display */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map((member) => (
                  <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={member.profile_image_url || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMembers = formData.members.filter(id => id !== member.id);
                        handleInputChange("members", newMembers);
                      }}
                      className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSave}
              disabled={isUpdating || !formData.name || !formData.leader_id}
              className="flex-1"
            >
              {isUpdating ? "Updating..." : "Update Team"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
