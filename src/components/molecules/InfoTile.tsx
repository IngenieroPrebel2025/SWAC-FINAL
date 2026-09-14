import * as React from "react";
import { cn } from "@/lib/utils";

interface InfoTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
  className?: string;
}

/** Dato compacto etiqueta/valor sobre superficie inset (fichas, resúmenes). */
export function InfoTile({ label, value, hint, icon, mono, className }: InfoTileProps) {
  return (
    <div
      className={cn("min-w-0 rounded-lg border px-3 py-2.5", className)}
      style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
    >
      <span
        className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-[0.08em]"
        style={{ color: "var(--kpi-label)" }}
      >
        {icon}
        {label}
      </span>
      <span
        className="mt-1 block truncate text-[13px] font-semibold"
        style={{ color: "var(--list-text)", fontFamily: mono ? "var(--font-mono)" : undefined }}
      >
        {value}
      </span>
      {hint && (
        <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--list-text-sub)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
