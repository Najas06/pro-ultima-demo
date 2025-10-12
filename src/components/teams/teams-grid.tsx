"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { Team, Staff } from "@/types";
import { useTeams } from "@/hooks/use-teams";
import { IconDots, IconEdit, IconTrash, IconUsers, IconUserCheck, IconPlus } from "@tabler/icons-react";

// Mock data for demonstration
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

const mockTeams: Team[] = [
  {
    id: "1",
    name: "Frontend Development",
    leader_id: "1",
    leader: mockStaff.find(s => s.id === "1"),
    members: [
      {
        id: "1",
        team_id: "1",
        staff_id: "1",
        staff: mockStaff.find(s => s.id === "1"),
        joined_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        team_id: "1",
        staff_id: "3",
        staff: mockStaff.find(s => s.id === "3"),
        joined_at: "2024-01-16T10:00:00Z",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Product Management",
    leader_id: "2",
    leader: mockStaff.find(s => s.id === "2"),
    members: [
      {
        id: "3",
        team_id: "2",
        staff_id: "2",
        staff: mockStaff.find(s => s.id === "2"),
        joined_at: "2024-01-16T10:00:00Z",
      },
      {
        id: "4",
        team_id: "2",
        staff_id: "4",
        staff: mockStaff.find(s => s.id === "4"),
        joined_at: "2024-01-17T10:00:00Z",
      },
    ],
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    name: "Backend Development",
    leader_id: "5",
    leader: mockStaff.find(s => s.id === "5"),
    members: [
      {
        id: "5",
        team_id: "3",
        staff_id: "5",
        staff: mockStaff.find(s => s.id === "5"),
        joined_at: "2024-01-19T10:00:00Z",
      },
    ],
    created_at: "2024-01-19T10:00:00Z",
    updated_at: "2024-01-19T10:00:00Z",
  },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export function TeamsGrid() {
  const { openTeamDialog } = useUIStore();
  const { teamMembers } = useTeams();

  const handleEdit = (teamId: string) => {
    openTeamDialog("edit", teamId);
  };

  const handleDelete = (teamId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete team:", teamId);
  };

  const handleCreateTeam = () => {
    openTeamDialog("create");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teams</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s teams and their members.
          </p>
        </div>
        <Button onClick={handleCreateTeam} className="flex items-center gap-2">
          <IconPlus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {mockTeams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first team to start organizing your staff members.
            </p>
            <Button onClick={handleCreateTeam}>
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockTeams.map((team) => (
            <Card key={team.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>
                      Created {formatDate(team.created_at)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(team.id)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(team.id)}
                        className="text-destructive"
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Team Captain */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <IconUserCheck className="h-4 w-4" />
                    Team Captain
                  </div>
                  {team.leader ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(team.leader.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{team.leader.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.leader.role} • {team.leader.department}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No captain assigned</p>
                  )}
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <IconUsers className="h-4 w-4" />
                      Team Members
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {teamMembers?.filter(tm => tm.team_id === team.id).length || 0}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {teamMembers?.filter(tm => tm.team_id === team.id).length || 0} team members
                    </Badge>
                    
                    {teamMembers?.filter(tm => tm.team_id === team.id).length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{(teamMembers?.filter(tm => tm.team_id === team.id).length || 0) - 3} more member(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Team Stats */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Members</span>
                    <span>{team.members?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
