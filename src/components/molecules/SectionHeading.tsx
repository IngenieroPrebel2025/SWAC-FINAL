import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Encabezado de sección dentro de una Surface (título uppercase + acciones). */
export function SectionHeading({ title, description, icon, actions, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em]"
          style={{ color: "var(--sect-sub)" }}
        >
          {icon}
          {title}
        </p>
        {description && (
          <p className="mt-1 text-[12px]" style={{ color: "var(--list-text-sub)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
