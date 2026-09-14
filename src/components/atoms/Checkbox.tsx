"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, label, id, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref ?? internalRef;

    React.useEffect(() => {
      const el = typeof resolvedRef === "function" ? null : resolvedRef.current;
      if (el) el.indeterminate = !!indeterminate;
    }, [indeterminate, resolvedRef]);

    const box = (
      <span className="relative inline-flex h-4 w-4 flex-shrink-0 items-center justify-center">
        <input
          ref={resolvedRef}
          type="checkbox"
          id={id}
          className={cn(
            "peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border transition-all",
            "bg-[var(--ctrl-bg)] border-[var(--ctrl-border)]",
            "checked:bg-[var(--radio-checked)] checked:border-[var(--radio-checked)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute flex items-center justify-center text-white opacity-0 peer-checked:opacity-100"
        >
          {indeterminate ? <Minus size={9} strokeWidth={3} /> : <Check size={9} strokeWidth={3} />}
        </span>
      </span>
    );

    if (label) {
      return (
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px]"
          style={{ color: "var(--list-text)" }}
        >
          {box}
          <span>{label}</span>
        </label>
      );
    }

    return box;
  }
);
Checkbox.displayName = "Checkbox";
