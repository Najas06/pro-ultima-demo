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

export type MemberNodeData = {
  data: {
    label: string;
    schema: { title: string; value: string }[];
  };
};

const MemberNode = memo(({ data }: MemberNodeData) => {
  return (
    <DatabaseSchemaNode className="p-0 min-w-[200px]">
      <DatabaseSchemaNodeHeader className="bg-gradient-to-r from-green-500/20 to-green-500/5">
        <LabeledHandle
          id="member-input"
          type="target"
          position={Position.Left}
          className="absolute left-0 top-1/2 -translate-y-1/2"
          handleClassName="!absolute"
        />
        {data.label}
      </DatabaseSchemaNodeHeader>
      <DatabaseSchemaNodeBody>
        {data.schema.map((entry, index) => (
          <DatabaseSchemaTableRow key={index}>
            <DatabaseSchemaTableCell className="pl-4 pr-2 font-medium text-muted-foreground">
              {entry.title}
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="pr-4 pl-2 text-foreground">
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






