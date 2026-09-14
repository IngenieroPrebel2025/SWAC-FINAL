import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + inline error wrapper. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--kpi-label)]"
      >
        {label}
        {required && (
          <span className="text-[12px] text-[var(--atom-coral-500)]">*</span>
        )}
      </label>

      {children}

      {hint && !error && (
        <span className="text-[11px] text-[var(--kpi-label)]">{hint}</span>
      )}

      {error && (
        <span
          role="alert"
          className="flex items-center gap-1.5 text-[11.5px] text-[var(--atom-coral-500)]"
        >
          <AlertCircle size={11} strokeWidth={2} />
          {error}
        </span>
      )}
    </div>
  );
}
