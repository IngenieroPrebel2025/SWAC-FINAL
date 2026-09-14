"use client";

import * as React from "react";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  /** Accessible summary. */
  ariaLabel: string;
}

/** Lightweight dependency-free vertical bar chart. */
export function BarChart({ data, height = 180, ariaLabel }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <div
        className="flex items-end justify-between gap-2"
        style={{ height }}
      >
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2 h-full">
            <div
              className="w-full rounded-t-md transition-[height] duration-500 ease-out"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: d.color ?? "var(--atom-blue-500)",
                minHeight: 4,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span
              className="truncate text-[10px] font-medium"
              style={{ color: "var(--kpi-label)", maxWidth: "100%" }}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
