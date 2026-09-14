import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types/ui";

const STATUS_MAP: Record<
  StatusTone,
  { label: string; bg: string; color: string; dot: string }
> = {
  active: {
    label: "Activo",
    bg: "var(--st-active-bg)",
    color: "var(--st-active-color)",
    dot: "var(--st-active-dot)",
  },
  warning: {
    label: "Advertencia",
    bg: "var(--st-warning-bg)",
    color: "var(--st-warning-color)",
    dot: "var(--st-warning-dot)",
  },
  maintenance: {
    label: "Mantenimiento",
    bg: "var(--st-maint-bg)",
    color: "var(--st-maint-color)",
    dot: "var(--st-maint-dot)",
  },
  inactive: {
    label: "Inactivo",
    bg: "var(--st-inactive-bg)",
    color: "var(--st-inactive-color)",
    dot: "var(--st-inactive-dot)",
  },
};

interface StatusBadgeProps {
  status: StatusTone;
  /** Override the default Spanish label. */
  label?: string;
  variant?: "card" | "list";
  className?: string;
}

export function StatusBadge({
  status,
  label,
  variant = "card",
  className,
}: StatusBadgeProps) {
  const st = STATUS_MAP[status];
  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{
        gap: variant === "list" ? 4 : 5,
        background: st.bg,
        borderRadius: 4,
        padding: variant === "list" ? "2px 7px" : "3px 8px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: st.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: st.color,
          letterSpacing: "0.03em",
        }}
      >
        {label ?? st.label}
      </span>
    </span>
  );
}
