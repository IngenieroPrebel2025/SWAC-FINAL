"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/** Selector de opción única compacto (filtros rápidos, presets, veredictos). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "sm",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("scrollbar-none inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg p-0.5", className)}
      style={{ background: "var(--ctrl-bg)", border: "1px solid var(--ctrl-border)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[12.5px]",
              !active && "hover:bg-[var(--sb-item-bg-hover)]"
            )}
            style={{
              background: active ? "var(--ctrl-bg-active)" : "transparent",
              color: active ? "var(--ctrl-text-active)" : "var(--ctrl-text)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
