"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Crown } from "lucide-react";
import type { Team } from "@/types";
import { useTeams } from "@/hooks/use-teams";

interface DeleteTeamDialogProps {
  team: Team | null;
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

const formatBranch = (branch?: string) => {
  if (!branch) return "No Branch";
  return branch.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export function DeleteTeamDialog({ team, isOpen, onClose }: DeleteTeamDialogProps) {
  const { deleteTeam, isDeleting } = useTeams();

  if (!team) return null;

  const memberCount = team.members?.length || 0;
  const totalMembers = memberCount + 1; // +1 for leader

  const handleDelete = () => {
    deleteTeam(team.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="w-[95vw] max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-red-600 dark:text-red-400">
            Delete Team
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to delete this team? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Team Preview */}
        <div className="my-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-amber-500/50 rounded-xl">
                <AvatarImage src={team.leader?.profile_image_url || ""} className="rounded-xl object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl text-amber-900 dark:text-amber-100 font-semibold">
                  {getInitials(team.leader?.name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                <Crown className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
                </div>
                {team.branch && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="capitalize">{formatBranch(team.branch)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Members Preview */}
          {memberCount > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Team Members:</p>
              <div className="flex flex-wrap gap-2">
                {team.members?.slice(0, 5).map((member) => (
                  <Badge key={member.id} variant="secondary" className="text-xs">
                    {member.staff?.name || "Unknown"}
                  </Badge>
                ))}
                {memberCount > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{memberCount - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
