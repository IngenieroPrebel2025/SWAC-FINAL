import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-9 w-full appearance-none rounded-md pl-3 pr-9 text-[13px] outline-none transition-colors cursor-pointer",
        "bg-[var(--ctrl-bg)] text-[var(--list-text)]",
        "border border-[var(--ctrl-border)]",
        "focus-visible:border-[var(--atom-blue-500)] focus-visible:ring-2 focus-visible:ring-[rgba(101,149,191,0.25)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid && "border-[var(--atom-coral-500)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      strokeWidth={2}
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ctrl-text)]"
    />
  </div>
));
Select.displayName = "Select";
