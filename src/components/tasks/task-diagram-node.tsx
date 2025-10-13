"use client";

import { memo } from "react";
import { Position } from "@xyflow/react";
import { LabeledHandle } from "@/components/ui/react-flow/labeled-handle";
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from "@/components/ui/react-flow/database-schema-node";

export type TaskDiagramNodeData = {
  data: {
    label: string;
    schema: { title: string; value: string; handleId?: string }[];
    nodeType?: 'task' | 'team' | 'member';
  };
};

const TaskDiagramNode = memo(({ data }: TaskDiagramNodeData) => {
  const nodeType = data.nodeType || 'task';
  
  // Different header colors for different node types
  const headerColor = 
    nodeType === 'task' ? 'from-blue-500/20 to-blue-500/5' :
    nodeType === 'team' ? 'from-purple-500/20 to-purple-500/5' :
    'from-green-500/20 to-green-500/5';

  return (
    <DatabaseSchemaNode className="p-0 min-w-[280px] max-w-[320px] hover:shadow-lg transition-shadow duration-200">
      <DatabaseSchemaNodeHeader className={`bg-gradient-to-r ${headerColor} text-sm font-semibold`}>
        <div className="truncate" title={data.label}>
          {data.label}
        </div>
      </DatabaseSchemaNodeHeader>
      <DatabaseSchemaNodeBody>
        {data.schema.map((entry, index) => (
          <DatabaseSchemaTableRow key={index} className="hover:bg-muted/30">
            <DatabaseSchemaTableCell className="pl-4 pr-2 font-medium text-muted-foreground text-sm">
              {entry.title}
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="pr-4 pl-2">
              {entry.handleId ? (
                <LabeledHandle
                  id={entry.handleId}
                  title={entry.value}
                  type="source"
                  position={Position.Right}
                  className="justify-end"
                  handleClassName="ml-2"
                  labelClassName="text-foreground font-medium"
                />
              ) : (
                <span className="text-foreground text-sm">{entry.value}</span>
              )}
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  );
});

TaskDiagramNode.displayName = "TaskDiagramNode";

export default TaskDiagramNode;






