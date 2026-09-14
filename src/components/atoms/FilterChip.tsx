"use client";

import * as React from "react";

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, count, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        fontSize: 12,
        fontWeight: active ? 500 : 400,
        borderRadius: 5,
        border: `1px solid ${active ? "var(--chip-border-active)" : "var(--chip-border)"}`,
        background: active ? "var(--chip-bg-active)" : "var(--chip-bg)",
        color: active ? "var(--chip-text-active)" : "var(--chip-text)",
        cursor: "pointer",
        transition: "all 120ms",
        fontFamily: "inherit",
        lineHeight: 1,
      }}
    >
      {label}
      <span
        style={{
          fontSize: 10,
          fontFamily: "'DM Mono', monospace",
          color: active ? "var(--chip-count-text-active)" : "var(--chip-count-text)",
          background: active ? "var(--chip-count-bg-active)" : "var(--chip-count-bg)",
          borderRadius: 3,
          padding: "1px 5px",
        }}
      >
        {count}
      </span>
    </button>
  );
}
