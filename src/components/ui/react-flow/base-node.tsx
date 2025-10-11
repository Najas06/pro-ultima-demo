"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BaseNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const BaseNode = React.forwardRef<HTMLDivElement, BaseNodeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BaseNode.displayName = "BaseNode";






