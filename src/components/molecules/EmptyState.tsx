import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-14 text-center"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        backdropFilter: "var(--card-blur)",
        WebkitBackdropFilter: "var(--card-blur)",
      }}
    >
      {Icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "var(--kpi-icon-info-bg)", color: "var(--kpi-icon-info-color)" }}
          aria-hidden="true"
        >
          <Icon size={22} strokeWidth={1.6} />
        </div>
      )}
      <div>
        <p className="text-[14px] font-semibold" style={{ color: "var(--sect-title)" }}>
          {title}
        </p>
        {description && (
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
