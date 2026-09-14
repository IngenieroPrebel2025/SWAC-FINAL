"use client";

import * as React from "react";

export interface GroupedBarDatum {
  label: string;
  values: number[];
}

interface GroupedBarChartProps {
  data: GroupedBarDatum[];
  series: { label: string; color: string }[];
  height?: number;
  unit?: string;
  ariaLabel: string;
}

/** Barras agrupadas por categoría (comparar real vs meta, etc.). Dependency-free. */
export function GroupedBarChart({ data, series, height = 200, unit = "", ariaLabel }: GroupedBarChartProps) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));

  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <div className="flex items-end justify-between gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
            <div className="flex h-full items-end justify-center gap-1">
              {d.values.map((v, i) => (
                <div
                  key={series[i]?.label ?? i}
                  className="w-full max-w-[22px] rounded-t-md transition-[height] duration-500 ease-out"
                  style={{ height: `${(v / max) * 100}%`, minHeight: 4, background: series[i]?.color }}
                  title={`${d.label} · ${series[i]?.label}: ${v}${unit}`}
                />
              ))}
            </div>
            <span
              className="line-clamp-2 text-center text-[10px] font-medium leading-tight"
              style={{ color: "var(--kpi-label)" }}
              title={d.label}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--sect-sub)" }}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
