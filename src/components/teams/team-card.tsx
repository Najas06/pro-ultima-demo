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
  Users, 
  MapPin, 
  Edit, 
  Trash2, 
  MoreVertical,
  Crown
} from "lucide-react";
import type { Team } from "@/types";
import { useTeams } from "@/hooks/use-teams";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  isDeleting?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatBranch = (branch?: string) => {
  if (!branch) return "No Branch";
  return branch.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export function TeamCard({ team, onEdit, onDelete, isDeleting }: TeamCardProps) {
  const { teamMembers } = useTeams();
  const teamMembersList = teamMembers?.filter(tm => tm.team_id === team.id) || [];
  const memberCount = teamMembersList.length;
  const totalMembers = memberCount + 1; // +1 for leader
  
  // Create members array with staff data for compatibility
  const membersWithStaff = teamMembersList.slice(0, 5);

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/20">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Card Header */}
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-bold truncate mb-1 group-hover:text-primary transition-colors">
              {team.name}
            </CardTitle>
            {team.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                {team.description}
              </p>
            )}
          </div>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="z-10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0  ml-2"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(team)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(team)} 
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="relative space-y-4 flex flex-col justify-between">
        {/* Team Leader */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent border border-amber-100/50 dark:border-amber-900/30">
          <div className="relative">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-500/50 rounded-xl">
              <AvatarImage src={team.leader?.profile_image_url || undefined} className="rounded-xl object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl text-amber-900 dark:text-amber-100 font-semibold text-sm">
                {getInitials(team.leader?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
              <Crown className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Leader</p>
            <p className="text-sm font-semibold truncate text-foreground">{team.leader?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground truncate">{team.leader?.role || ""}</p>
          </div>
        </div>

        {/* Branch & Members Count */}
        <div className="grid grid-cols-2 gap-3">
          {/* Branch */}
          {team.branch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent border border-blue-100/50 dark:border-blue-900/30">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Branch</p>
                <p className="text-sm font-medium capitalize truncate text-foreground">
                  {formatBranch(team.branch)}
                </p>
              </div>
            </div>
          )}

          {/* Members Count */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent border border-green-100/50 dark:border-green-900/30">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members</p>
              <p className="text-sm font-medium text-foreground">
                {totalMembers} {totalMembers === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </div>

      </CardContent>

      {/* Card Footer - Clean footer with just stats */}
      <CardFooter className="relative pt-4 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Created {new Date().toLocaleDateString()}</span>
          <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
        </div>
      </CardFooter>

      {/* Decorative Corner Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
}

