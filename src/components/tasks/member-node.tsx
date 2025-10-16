"use client";

import { memo } from "react";
import { Position } from "@xyflow/react";
import { LabeledHandle } from "@/components/ui/react-flow/labeled-handle";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from "@/components/ui/react-flow/database-schema-node";

export type MemberNodeData = {
  data: {
    label: string;
    schema: { title: string; value: string }[];
    isLeader?: boolean; // Add leader flag
    profileImage?: string; // Add profile image URL
  };
};

const MemberNode = memo(({ data }: MemberNodeData) => {
  return (
    <DatabaseSchemaNode className="p-0 min-w-[180px] max-w-[220px] hover:shadow-lg transition-shadow duration-200">
      <DatabaseSchemaNodeHeader className="bg-gradient-to-r from-green-500/20 to-green-500/5 text-sm">
        <LabeledHandle
          id="member-input"
          type="target"
          position={Position.Left}
          className="absolute left-0 top-1/2 -translate-y-1/2"
          handleClassName="!absolute"
        />
        <div className="flex items-center gap-2 w-full">
          {/* Profile Image */}
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={data.profileImage} alt={data.label} />
            <AvatarFallback className="text-xs">
              {data.label.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2 truncate flex-1">
            <span className="truncate font-semibold" title={data.label}>
              {data.label}
            </span>
            {data.isLeader && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Leader
              </Badge>
            )}
          </div>
        </div>
      </DatabaseSchemaNodeHeader>
      <DatabaseSchemaNodeBody className="text-xs">
        {data.schema.map((entry, index) => (
          <DatabaseSchemaTableRow key={index} className="hover:bg-muted/30">
            <DatabaseSchemaTableCell className="pl-3 pr-1 font-medium text-muted-foreground text-xs">
              {entry.title}
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="pr-3 pl-1 text-foreground text-xs truncate" title={entry.value}>
              {entry.value}
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  );
});

MemberNode.displayName = "MemberNode";

export default MemberNode;






