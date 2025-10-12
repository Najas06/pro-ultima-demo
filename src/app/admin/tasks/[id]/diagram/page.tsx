"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReactFlow, Background, Controls, Node, Edge, BackgroundVariant, Panel, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTasks } from "@/hooks/use-tasks";
import TaskDiagramNode from "@/components/tasks/task-diagram-node";
import MemberNode from "@/components/tasks/member-node";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";

export const dynamic = 'force-dynamic';

const nodeTypes = {
  taskNode: TaskDiagramNode,
  memberNode: MemberNode,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDiagramPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const { tasks, isLoading } = useTasks();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const task = tasks.find((t) => t.id === resolvedParams.id);

  // Listen for data updates and refetch tasks data
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('🔄 Diagram: Real-time update detected - refreshing tasks data');
      queryClient.invalidateQueries({ queryKey: ['offline-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['offline-staff'] });
      queryClient.invalidateQueries({ queryKey: ['offline-teams'] });
    };

    // Listen for custom dataUpdated event
    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [queryClient]);

  const buildDiagram = useCallback(() => {
    if (!task) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Build task info schema
    const taskSchema = [
      { title: "Status", value: task.status.toUpperCase(), handleId: undefined },
      { title: "Priority", value: task.priority.toUpperCase(), handleId: undefined },
      { title: "Due Date", value: task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set", handleId: undefined },
      { title: "Allocation", value: task.allocation_mode === 'individual' ? 'Individual' : 'Team', handleId: "allocation" },
    ];

    // Task node
    newNodes.push({
      id: "task",
      type: "taskNode",
      position: { x: 50, y: 50 },
      data: {
        label: task.title,
        schema: taskSchema,
        nodeType: 'task',
      },
    });

    if (task.allocation_mode === 'team' && task.assigned_team_ids?.length > 0) {
      // Team node
      const teamSchema = [
        { title: "Teams Assigned", value: `${task.assigned_team_ids.length} team${task.assigned_team_ids.length > 1 ? 's' : ''}`, handleId: undefined },
        { title: "Staff Members", value: `${task.assigned_staff_ids?.length || 0} members`, handleId: "team-members" },
      ];

      newNodes.push({
        id: "team",
        type: "taskNode",
        position: { x: 450, y: 50 },
        data: {
          label: `Teams: ${task.assigned_team_ids.length}`,
          schema: teamSchema,
          nodeType: 'team',
        },
      });

      // Edge from task to team
      newEdges.push({
        id: "task-team",
        source: "task",
        sourceHandle: "allocation",
        target: "team",
        targetHandle: undefined,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
      });

      // Add team members
      if (task.assigned_staff && task.assigned_staff.length > 0) {
        task.assigned_staff.forEach((assignment, index) => {
          if (assignment.staff) {
            const memberSchema = [
              { title: "Email", value: assignment.staff.email || "Not set" },
              { title: "Role", value: assignment.staff.role || "Not set" },
              { title: "Department", value: assignment.staff.department || "Not set" },
            ];

            const yPosition = 50 + (index * 180);

            newNodes.push({
              id: `member-${assignment.staff.id}`,
              type: "memberNode",
              position: { x: 850, y: yPosition },
              data: {
                label: assignment.staff.name,
                schema: memberSchema,
              },
            });

            // Edge from team to member
            newEdges.push({
              id: `team-member-${assignment.staff.id}`,
              source: "team",
              sourceHandle: "team-members",
              target: `member-${assignment.staff.id}`,
              targetHandle: "member-input",
              animated: true,
              style: { stroke: '#22c55e', strokeWidth: 2 },
            });
          }
        });
      }
    } else if (task.allocation_mode === 'individual' && task.assigned_staff_ids?.length > 0) {
      // Individual assignee nodes
      task.assigned_staff_ids.forEach((staffId: string, index: number) => {
        const memberSchema = [
          { title: "Staff ID", value: staffId },
          { title: "Assignment", value: `Staff member ${index + 1}` },
        ];

        newNodes.push({
          id: `assignee-${staffId}`,
          type: "memberNode",
          position: { x: 450, y: 50 + (index * 150) },
          data: {
            label: `Staff: ${staffId.slice(0, 8)}`,
            schema: memberSchema,
          },
        });

        // Edge from task to assignee
        newEdges.push({
          id: `task-assignee-${staffId}`,
          source: "task",
          sourceHandle: "allocation",
          target: `assignee-${staffId}`,
          targetHandle: "member-input",
          animated: true,
          style: { stroke: '#22c55e', strokeWidth: 2 },
        });
      });
    }

    // Only update if there are actual changes to prevent unnecessary re-renders
    setNodes(prevNodes => {
      if (prevNodes.length === newNodes.length && 
          JSON.stringify(prevNodes) === JSON.stringify(newNodes)) {
        return prevNodes;
      }
      return newNodes;
    });
    
    setEdges(prevEdges => {
      if (prevEdges.length === newEdges.length && 
          JSON.stringify(prevEdges) === JSON.stringify(newEdges)) {
        return prevEdges;
      }
      return newEdges;
    });
  }, [task]);

  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      setIsInitialized(true);
    }
  }, [isLoading, tasks.length]);

  useEffect(() => {
    if (isInitialized && task) {
      buildDiagram();
    }
  }, [task, buildDiagram, isInitialized]);

  // Show loading state until data is initialized
  if (!isInitialized || isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading task diagram...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show not found only after data is loaded
  if (isInitialized && !task) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Task Not Found</CardTitle>
                <CardDescription>
                  The task you&apos;re looking for doesn&apos;t exist or has been deleted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/admin/tasks")} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Tasks
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // This should only render if task exists (guaranteed by the checks above)
  if (!task) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
              defaultEdgeOptions={{
                type: 'smoothstep',
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
              
              <Panel position="top-left" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg p-4 m-4">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/tasks")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold">{task.title}</h2>
                    <p className="text-sm text-muted-foreground">Task Assignment Diagram</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                  <Badge variant={
                    task.priority === 'urgent' ? 'destructive' :
                    task.priority === 'high' ? 'default' :
                    'secondary'
                  }>
                    {task.priority}
                  </Badge>
                  <Badge variant="outline">
                    {task.allocation_mode === 'individual' ? 'Individual' : 'Team'}
                  </Badge>
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-4 max-w-md">
                    {task.description}
                  </p>
                )}
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

