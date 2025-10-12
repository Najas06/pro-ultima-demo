"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Team, Task } from "@/types";
import { useTeams } from "@/hooks/use-teams";
import { 
  IconUsers, 
  IconUserCheck, 
  IconArrowRight,
  IconTrendingUp,
  IconTrendingDown
} from "@tabler/icons-react";

interface TeamOverviewProps {
  teams: Team[];
  tasks: Task[];
  limit?: number;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getTeamProductivity = (teamId: string, tasks: Task[]) => {
  const teamTasks = tasks.filter(task => 
    task.assigned_team_ids && task.assigned_team_ids.includes(teamId)
  );
  
  if (teamTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
  
  const completed = teamTasks.filter(task => task.status === "completed").length;
  const percentage = Math.round((completed / teamTasks.length) * 100);
  
  return { completed, total: teamTasks.length, percentage };
};

const getProductivityColor = (percentage: number) => {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-yellow-600";
  return "text-red-600";
};

const getProductivityIcon = (percentage: number) => {
  if (percentage >= 60) return IconTrendingUp;
  return IconTrendingDown;
};

export function TeamOverview({ teams, tasks, limit = 3 }: TeamOverviewProps) {
  const { teamMembers } = useTeams();
  
  // Sort teams by member count (largest first) and take the limit
  const topTeams = teams
    .sort((a, b) => {
      const aMemberCount = teamMembers?.filter(tm => tm.team_id === a.id).length || 0;
      const bMemberCount = teamMembers?.filter(tm => tm.team_id === b.id).length || 0;
      return bMemberCount - aMemberCount;
    })
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>
              Top performing teams and their productivity
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No teams available</p>
            </div>
          ) : (
            topTeams.map((team) => {
              const productivity = getTeamProductivity(team.id, tasks);
              const ProductivityIcon = getProductivityIcon(productivity.percentage);
              
              return (
                <div key={team.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{team.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {teamMembers?.filter(tm => tm.team_id === team.id).length || 0} members
                      </Badge>
                    </div>
                    
                    {team.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {team.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-3 w-3" />
                        <span>{teamMembers?.filter(tm => tm.team_id === team.id).length || 0} members</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <IconUserCheck className="h-3 w-3" />
                        <span>{productivity.completed}/{productivity.total} tasks</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${productivity.percentage}%` }}
                        ></div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${getProductivityColor(productivity.percentage)}`}>
                        <ProductivityIcon className="h-3 w-3" />
                        <span>{productivity.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    {team.leader && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(team.leader.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {teamMembers?.filter(tm => tm.team_id === team.id).length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {teamMembers?.filter(tm => tm.team_id === team.id).length} members
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

