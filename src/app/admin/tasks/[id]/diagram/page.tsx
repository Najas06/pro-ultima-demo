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

    // Enhanced debug logging
    console.log('🎯 Task data for diagram:', {
      id: task.id,
      title: task.title,
      allocation_mode: task.allocation_mode,
      assigned_staff_ids: task.assigned_staff_ids,
      assigned_staff_count: task.assigned_staff?.length || 0,
      assigned_staff_structure: task.assigned_staff?.map(a => ({
        id: a.id,
        staff_id: a.staff_id,
        has_staff_object: !!a.staff,
        staff_name: a.staff?.name
      })),
      assigned_team_ids: task.assigned_team_ids,
      support_files: task.support_files
    });

    // Improved positioning constants
    const TASK_X = 400; // Center task node
    const TASK_Y = 100;
    const TEAM_Y = 350; // Below task
    const MEMBER_START_Y = 600;
    const MEMBER_SPACING_X = 300;
    const MEMBER_SPACING_Y = 180;
    const MEMBERS_PER_ROW = 3;

    // Build task info schema
    const taskSchema = [
      { title: "Task Name", value: task.title, handleId: undefined },
      { title: "Status", value: task.status.toUpperCase(), handleId: undefined },
      { title: "Priority", value: task.priority.toUpperCase(), handleId: undefined },
      { title: "Due Date", value: task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set", handleId: undefined },
      // Add file links/preview if support_files exists
      ...(task.support_files && task.support_files.length > 0 
        ? [{ title: "Files", value: `${task.support_files.length} file(s)`, handleId: "files" }] 
        : []
      ),
      { title: "Allocation", value: task.allocation_mode === 'individual' ? 'Individual' : 'Team', handleId: "allocation" },
    ];

    // Task node - centered at top
    newNodes.push({
      id: "task",
      type: "taskNode",
      position: { x: TASK_X, y: TASK_Y },
      draggable: true,
      data: {
        label: `Task: ${task.task_no || 'N/A'}`,
        schema: taskSchema,
        nodeType: 'task',
        support_files: task.support_files, // Pass files for click handling
      },
    });

    // Add file nodes if support_files exist
    if (task.support_files && task.support_files.length > 0) {
      const FILE_START_X = TASK_X + 400; // Right of task
      const FILE_SPACING_Y = 120;
      
      task.support_files.forEach((fileUrl, index) => {
        const fileName = fileUrl.split('/').pop()?.split('-').slice(1).join('-') || `File ${index + 1}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
        
        const fileSchema = [
          { title: "Type", value: isImage ? "Image" : "Document" },
          { title: "Link", value: "View File", handleId: `file-link-${index}` },
        ];
        
        newNodes.push({
          id: `file-${index}`,
          type: "taskNode",
          position: { x: FILE_START_X, y: TASK_Y + (index * FILE_SPACING_Y) },
          draggable: true,
          data: {
            label: fileName,
            schema: fileSchema,
            nodeType: 'file',
            fileUrl: fileUrl, // Pass URL for clicking
            isImage: isImage,
          },
        });
        
        // Edge from task to file
        newEdges.push({
          id: `task-file-${index}`,
          source: "task",
          sourceHandle: "files",
          target: `file-${index}`,
          animated: false,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
        });
      });
    }

    if (task.allocation_mode === 'team' && task.assigned_team_ids?.length > 0) {
      console.log(`🏢 Processing team assignment for task ${task.id}:`, {
        team_ids: task.assigned_team_ids,
        assigned_staff_count: task.assigned_staff?.length || 0,
        assigned_staff: task.assigned_staff?.map(a => ({
          id: a.id,
          staff_id: a.staff_id,
          staff_name: a.staff?.name
        }))
      });
      
      // Team node - centered below task
      const teamSchema = [
        { title: "Teams Assigned", value: `${task.assigned_team_ids.length} team${task.assigned_team_ids.length > 1 ? 's' : ''}`, handleId: undefined },
        { title: "Staff Members", value: `${task.assigned_staff?.length || 0} members`, handleId: "team-members" },
      ];

      newNodes.push({
        id: "team",
        type: "taskNode",
        position: { x: TASK_X, y: TEAM_Y },
        draggable: true,
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

      // Add team members in grid layout
      if (task.assigned_staff && task.assigned_staff.length > 0) {
        console.log(`👥 Creating ${task.assigned_staff.length} team member nodes`);
        task.assigned_staff.forEach((assignment, index) => {
          console.log(`👤 Processing team member ${index + 1}:`, {
            assignment_id: assignment.id,
            staff_id: assignment.staff_id,
            staff_name: assignment.staff?.name,
            has_staff_object: !!assignment.staff
          });
          
          if (assignment.staff) {
            // Check if this staff is a team leader
            const isLeader = task.assigned_teams?.some(team => 
              team.leader_id === assignment.staff?.id
            );

            const memberSchema = [
              { title: "Branch", value: assignment.staff.branch || "Not set" },
              { title: "Role", value: assignment.staff.role || "Not set" },
              { title: "Department", value: assignment.staff.department || "Not set" },
              { title: "Email", value: assignment.staff.email || "Not set" },
            ];

            // Calculate grid position
            const row = Math.floor(index / MEMBERS_PER_ROW);
            const col = index % MEMBERS_PER_ROW;
            const memberX = TASK_X - (MEMBER_SPACING_X * (MEMBERS_PER_ROW - 1) / 2) + (col * MEMBER_SPACING_X);
            const memberY = MEMBER_START_Y + (row * MEMBER_SPACING_Y);

            newNodes.push({
              id: `member-${assignment.staff.id}`,
              type: "memberNode",
              position: { x: memberX, y: memberY },
              draggable: true,
              data: {
                label: assignment.staff.name,
                schema: memberSchema,
                isLeader: isLeader, // Pass leader flag
                profileImage: assignment.staff.profile_image_url, // Add profile image
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
          } else {
            console.error(`❌ Team member ${index + 1} has no staff object:`, assignment);
          }
        });
      } else {
        console.error(`❌ No team members found for task ${task.id}. assigned_staff:`, task.assigned_staff);
      }
    } else if (task.allocation_mode === 'individual' && task.assigned_staff_ids?.length > 0) {
      // Individual assignee nodes in grid layout
      task.assigned_staff_ids.forEach((staffId: string, index: number) => {
        console.log(`🔍 Looking for staff with ID: ${staffId}`);
        
        // Find staff member details from assigned_staff
        const staffMember = task.assigned_staff?.find(a => a.staff_id === staffId);
        
        console.log(`📌 Found staff member:`, staffMember ? {
          staff_id: staffMember.staff_id,
          has_staff: !!staffMember.staff,
          staff_name: staffMember.staff?.name
        } : 'NOT FOUND');

        if (staffMember && staffMember.staff) {
          const memberSchema = [
            { title: "Branch", value: staffMember.staff.branch || "Not set" },
            { title: "Role", value: staffMember.staff.role || "Not set" },
            { title: "Department", value: staffMember.staff.department || "Not set" },
            { title: "Email", value: staffMember.staff.email || "Not set" },
          ];

          // Calculate grid position for individual assignments
          const row = Math.floor(index / MEMBERS_PER_ROW);
          const col = index % MEMBERS_PER_ROW;
          const memberX = TASK_X - (MEMBER_SPACING_X * (MEMBERS_PER_ROW - 1) / 2) + (col * MEMBER_SPACING_X);
          const memberY = MEMBER_START_Y + (row * MEMBER_SPACING_Y);

          newNodes.push({
            id: `assignee-${staffId}`,
            type: "memberNode",
            position: { x: memberX, y: memberY },
            draggable: true,
            data: {
              label: staffMember.staff.name, // Show actual name instead of ID
              schema: memberSchema,
              profileImage: staffMember.staff.profile_image_url, // Add profile image
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
        } else {
          console.error(`❌ Cannot create node: staff member not found or incomplete for ID ${staffId}`);
        }
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
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading task diagram...</p>
        </div>
      </div>
    );
  }

  // Show not found only after data is loaded
  if (isInitialized && !task) {
    return (
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
    );
  }

  // This should only render if task exists (guaranteed by the checks above)
  if (!task) return null;

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))]">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          
          <Panel position="top-right" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg p-4 m-4 max-w-sm">
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
  );
}

