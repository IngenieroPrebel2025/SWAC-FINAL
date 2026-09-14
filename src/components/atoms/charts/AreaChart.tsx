"use client";

import * as React from "react";

interface AreaChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  stroke?: string;
  fill?: string;
  ariaLabel: string;
}

/** Smooth dependency-free area/line chart rendered as inline SVG. */
export function AreaChart({
  data,
  labels,
  height = 180,
  stroke = "var(--atom-blue-500)",
  fill = "rgba(101,149,191,0.16)",
  ariaLabel,
}: AreaChartProps) {
  const width = 600;
  const pad = 8;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <polygon points={area} fill={fill} />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill={stroke} />
        ))}
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between">
          {labels.map((l) => (
            <span key={l} className="text-[10px]" style={{ color: "var(--kpi-label)" }}>
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
