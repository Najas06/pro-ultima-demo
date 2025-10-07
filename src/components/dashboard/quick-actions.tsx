"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  IconPlus, 
  IconUsers, 
  IconListDetails, 
  IconChartBar,
  IconSettings,
  IconBell
} from "@tabler/icons-react";

interface QuickActionsProps {
  onCreateTask?: () => void;
  onCreateTeam?: () => void;
  onViewReports?: () => void;
  onManageStaff?: () => void;
}

export function QuickActions({ 
  onCreateTask, 
  onCreateTeam, 
  onViewReports, 
  onManageStaff 
}: QuickActionsProps) {
  const actions = [
    {
      title: "Create Task",
      description: "Add a new task to the system",
      icon: IconPlus,
      onClick: onCreateTask,
      color: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    },
    {
      title: "Create Team",
      description: "Set up a new team",
      icon: IconUsers,
      onClick: onCreateTeam,
      color: "bg-green-100 text-green-600 hover:bg-green-200",
    },
    {
      title: "View Reports",
      description: "Check analytics and reports",
      icon: IconChartBar,
      onClick: onViewReports,
      color: "bg-purple-100 text-purple-600 hover:bg-purple-200",
    },
    {
      title: "Manage Staff",
      description: "Add or edit staff members",
      icon: IconListDetails,
      onClick: onManageStaff,
      color: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-2 ${action.color}`}
                onClick={action.onClick}
              >
                <IconComponent className="h-5 w-5" />
                <div className="text-center">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

