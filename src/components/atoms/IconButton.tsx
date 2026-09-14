import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required since the button has no text. */
  label: string;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, active, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-transparent",
        "text-[var(--hd-icon-color)] cursor-pointer transition-colors",
        "hover:bg-[var(--hd-icon-bg-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)]",
        active && "bg-[var(--hd-icon-bg-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = "IconButton";
