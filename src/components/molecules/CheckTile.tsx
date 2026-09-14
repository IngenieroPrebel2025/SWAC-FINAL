"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckTileProps {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

/** Casilla de verificación en formato tarjeta (cumple / no cumple). */
export function CheckTile({ label, description, checked, onToggle, disabled, className }: CheckTileProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)] disabled:opacity-60",
        className
      )}
      style={{
        background: checked ? "var(--st-active-bg)" : "var(--st-warning-bg)",
        borderColor: checked ? "rgba(114,166,137,0.35)" : "rgba(242,125,114,0.35)",
      }}
    >
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px]" style={{ color: "var(--sect-sub)" }}>
            {description}
          </span>
        )}
      </span>
      {checked ? (
        <CheckCircle2 size={18} className="shrink-0" style={{ color: "var(--st-active-dot)" }} aria-hidden="true" />
      ) : (
        <XCircle size={18} className="shrink-0" style={{ color: "var(--st-warning-dot)" }} aria-hidden="true" />
      )}
    </button>
  );
}
