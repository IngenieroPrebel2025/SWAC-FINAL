import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  /** Adds hover elevation for interactive surfaces. */
  interactive?: boolean;
};

/** Standard glass card surface used across pages. */
export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, as: Tag = "div", interactive, style, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        "rounded-xl border",
        interactive && "transition-[transform,box-shadow,border-color] duration-200",
        className
      )}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
        backdropFilter: "var(--card-blur)",
        WebkitBackdropFilter: "var(--card-blur)",
        ...style,
      }}
      {...props}
    />
  )
);
Surface.displayName = "Surface";
