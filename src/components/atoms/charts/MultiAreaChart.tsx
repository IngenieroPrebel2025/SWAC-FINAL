"use client";

import * as React from "react";

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

interface MultiAreaChartProps {
  series: ChartSeries[];
  labels: string[];
  height?: number;
  ariaLabel: string;
}

/** Gráfico de áreas/líneas multi-serie, dependency-free (SVG). */
export function MultiAreaChart({ series, labels, height = 220, ariaLabel }: MultiAreaChartProps) {
  const width = 640;
  const padX = 6;
  const padY = 10;
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const count = Math.max(labels.length, ...series.map((s) => s.data.length));

  const x = (i: number) => padX + (i / Math.max(1, count - 1)) * (width - padX * 2);
  const y = (v: number) => padY + (1 - v / max) * (height - padY * 2);
  const step = count > 10 ? 2 : 1;

  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <div className="relative">
        <span className="absolute left-0 top-0 text-[10px]" style={{ color: "var(--kpi-label)", fontFamily: "var(--font-mono)" }}>
          {Math.round(max)}
        </span>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={0}
              x2={width}
              y1={padY + (1 - f) * (height - padY * 2)}
              y2={padY + (1 - f) * (height - padY * 2)}
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--divider)" }}
            />
          ))}
          {series.map((s) => {
            const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
            return (
              <g key={s.label}>
                {s.fill && (
                  <polygon
                    points={`${x(0)},${height - padY} ${pts} ${x(s.data.length - 1)},${height - padY}`}
                    style={{ fill: s.color, fillOpacity: 0.16 }}
                  />
                )}
                <polyline
                  points={pts}
                  fill="none"
                  strokeWidth={2.25}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? "6 5" : undefined}
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: s.color }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between">
        {labels.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className="text-[10px]"
            style={{ color: "var(--kpi-label)", visibility: i % step === 0 ? "visible" : "hidden" }}
          >
            {l}
          </span>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--sect-sub)" }}>
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 rounded"
              style={{
                background: s.dashed ? "transparent" : s.color,
                borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
              }}
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
