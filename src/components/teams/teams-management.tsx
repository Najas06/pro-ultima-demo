"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search,
} from "lucide-react";
import { useOfflineTeams } from "@/hooks/use-offline-teams";
import { TeamCard } from "./team-card";
import { TeamCardSkeleton } from "./team-card-skeleton";
import { TeamFormDialog } from "./team-form-dialog";
import { EditTeamDialog } from "./edit-team-dialog";
import { DeleteTeamDialog } from "./delete-team-dialog";
import { SyncStatusIndicator } from "@/components/ui/sync-status-indicator";
import type { Team } from "@/types";

export function TeamsManagement() {
  // ============================================
  // CUSTOM HOOKS
  // ============================================
  const {
    teams,
    isLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    isCreating,
    isUpdating,
    isDeleting,
    syncStatus,
    isOnline,
    pendingOperations,
    downloadData,
    syncAll,
  } = useOfflineTeams();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================
  // FILTERED TEAMS
  // ============================================
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        searchQuery === "" ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.leader?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.branch?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [teams, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCreateTeam = (data: {
    name: string;
    description?: string;
    leader_id: string;
    branch?: string;
    member_ids: string[];
  }) => {
    createTeam(data);
  };

  const handleUpdateTeam = (data: {
    id: string;
    name: string;
    description?: string;
    leader_id: string;
    branch?: string;
    member_ids: string[];
  }) => {
    updateTeam(data);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (team: Team) => {
    setDeletingTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteById = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      handleDelete(team);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
    }
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingTeam(null);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeletingTeam(null);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Teams Management
            </h1>
            <SyncStatusIndicator showDownloadButton={true} />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create and manage your teams with leaders and members
            {!isOnline && " (Working offline)"}
          </p>
        </div>

        {/* Add Team Button */}
        <Button 
          className=" text-white w-full sm:w-auto"
          onClick={() => {
            setEditingTeam(null);
            setIsDialogOpen(true);
          }}
          variant={'default'}
        >
          <Users className="w-4 h-4" />
          Create New Team
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams by name, leader, or branch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 h-9 bg-background/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-all text-sm sm:text-base"
        />
      </div>

      {/* Results Count */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        {searchQuery ? (
          <span>
            Showing <strong className="text-foreground">{filteredTeams.length}</strong> of{" "}
            <strong className="text-foreground">{teams.length}</strong> teams
          </span>
        ) : (
          <span>
            <strong className="text-foreground">{teams.length}</strong>{" "}
            {teams.length === 1 ? "team" : "teams"} total
          </span>
        )}
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Empty State - No teams at all */}
      {!isLoading && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold">No Teams Found</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1 text-center px-4">
            Click &quot;Create New Team&quot; to get started.
          </p>
        </div>
      )}

      {/* Empty State - No results from search */}
      {!isLoading && teams.length > 0 && filteredTeams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold">No Matching Teams</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1 text-center px-4">
            Try adjusting your search query.
          </p>
        </div>
      )}

      {/* Create Team Dialog */}
      <TeamFormDialog
        team={null}
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleCreateTeam}
        onUpdate={handleUpdateTeam}
        onDelete={handleDeleteById}
        isSubmitting={isCreating}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />

      {/* Edit Team Dialog */}
      {editingTeam && (
        <EditTeamDialog
          team={editingTeam}
          isOpen={isEditDialogOpen}
          onClose={handleEditDialogClose}
        />
      )}

      {/* Delete Team Dialog */}
      <DeleteTeamDialog
        team={deletingTeam}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
      />
    </div>
  );
}
