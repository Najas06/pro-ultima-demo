"use client";

import * as React from "react";
import { Handle, HandleProps, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface LabeledHandleProps extends HandleProps {
  title?: string;
  handleClassName?: string;
  labelClassName?: string;
}

export const LabeledHandle = React.forwardRef<HTMLDivElement, LabeledHandleProps>(
  ({ title, handleClassName, labelClassName, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center", className)}>
        {props.position === Position.Left && title && (
          <span className={cn("text-xs mr-2", labelClassName)}>{title}</span>
        )}
        <Handle
          {...props}
          className={cn(
            "!relative !transform-none !top-auto !left-auto !right-auto !bottom-auto",
            "w-3 h-3 rounded-full border-2 border-primary bg-background",
            handleClassName
          )}
        />
        {props.position === Position.Right && title && (
          <span className={cn("text-xs ml-2", labelClassName)}>{title}</span>
        )}
      </div>
    );
  }
);

LabeledHandle.displayName = "LabeledHandle";






