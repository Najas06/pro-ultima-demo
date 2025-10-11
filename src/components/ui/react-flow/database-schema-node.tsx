"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { BaseNode } from "./base-node";

interface DatabaseSchemaNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DatabaseSchemaNode = React.forwardRef<HTMLDivElement, DatabaseSchemaNodeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseNode ref={ref} className={cn("overflow-hidden", className)} {...props}>
        {children}
      </BaseNode>
    );
  }
);

DatabaseSchemaNode.displayName = "DatabaseSchemaNode";

interface DatabaseSchemaNodeHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DatabaseSchemaNodeHeader = React.forwardRef<HTMLDivElement, DatabaseSchemaNodeHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-4 py-3 font-semibold bg-gradient-to-r from-primary/10 to-primary/5 border-b",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DatabaseSchemaNodeHeader.displayName = "DatabaseSchemaNodeHeader";

interface DatabaseSchemaNodeBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const DatabaseSchemaNodeBody = React.forwardRef<HTMLTableSectionElement, DatabaseSchemaNodeBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <table className="w-full">
        <tbody ref={ref} className={cn("divide-y", className)} {...props}>
          {children}
        </tbody>
      </table>
    );
  }
);

DatabaseSchemaNodeBody.displayName = "DatabaseSchemaNodeBody";

interface DatabaseSchemaTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export const DatabaseSchemaTableRow = React.forwardRef<HTMLTableRowElement, DatabaseSchemaTableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr ref={ref} className={cn("hover:bg-muted/50", className)} {...props}>
        {children}
      </tr>
    );
  }
);

DatabaseSchemaTableRow.displayName = "DatabaseSchemaTableRow";

interface DatabaseSchemaTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const DatabaseSchemaTableCell = React.forwardRef<HTMLTableCellElement, DatabaseSchemaTableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td ref={ref} className={cn("px-4 py-2 text-sm", className)} {...props}>
        {children}
      </td>
    );
  }
);

DatabaseSchemaTableCell.displayName = "DatabaseSchemaTableCell";






