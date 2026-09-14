import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "h-9 w-full rounded-md px-3 text-[13px] outline-none transition-colors",
      "bg-[var(--ctrl-bg)] text-[var(--list-text)]",
      "border border-[var(--ctrl-border)]",
      "placeholder:text-[var(--hd-search-ph)]",
      "focus-visible:border-[var(--atom-blue-500)] focus-visible:ring-2 focus-visible:ring-[rgba(101,149,191,0.25)]",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      invalid && "border-[var(--atom-coral-500)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
