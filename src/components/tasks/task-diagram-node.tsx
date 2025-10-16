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
    schema: { title: string; value: string; handleId?: string; link?: string }[];
    nodeType?: 'task' | 'team' | 'member' | 'file';
    support_files?: string[]; // Add support for files
    fileUrl?: string; // For file nodes
    isImage?: boolean; // For file nodes
  };
};

const TaskDiagramNode = memo(({ data }: TaskDiagramNodeData) => {
  const nodeType = data.nodeType || 'task';
  
  // Different header colors for different node types
  const headerColor = 
    nodeType === 'task' ? 'from-blue-500/20 to-blue-500/5' :
    nodeType === 'team' ? 'from-purple-500/20 to-purple-500/5' :
    nodeType === 'file' ? 'from-orange-500/20 to-orange-500/5' : // Add file color
    'from-green-500/20 to-green-500/5';

  return (
    <DatabaseSchemaNode className="p-0 min-w-[280px] max-w-[320px] hover:shadow-lg transition-shadow duration-200">
      {/* Show image preview for file nodes */}
      {data.nodeType === 'file' && data.isImage && data.fileUrl && (
        <div className="p-2">
          <img 
            src={data.fileUrl} 
            alt={data.label}
            className="w-full h-32 object-cover rounded"
          />
        </div>
      )}
      
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
              {entry.handleId?.startsWith('file-link') ? (
                <a 
                  href={data.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  {entry.value}
                </a>
              ) : entry.handleId === 'files' ? (
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    // Open first file or show files dialog
                    if (data.support_files && data.support_files.length > 0) {
                      window.open(data.support_files[0], '_blank');
                    }
                  }}
                  className="text-primary hover:underline text-sm cursor-pointer"
                >
                  {entry.value}
                </a>
              ) : entry.handleId ? (
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






