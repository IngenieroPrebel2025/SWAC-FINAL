"use client";

import * as React from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  ariaLabel: string;
}

/** Dependency-free donut chart with a legend. */
export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
  ariaLabel,
}: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
        style={{ flexShrink: 0 }}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((seg) => {
            const len = (seg.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        {(centerValue || centerLabel) && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            {centerValue && (
              <tspan
                x="50%"
                dy="-2"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fill: "var(--kpi-value)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {centerValue}
              </tspan>
            )}
            {centerLabel && (
              <tspan
                x="50%"
                dy="18"
                style={{ fontSize: 10, fill: "var(--kpi-label)" }}
              >
                {centerLabel}
              </tspan>
            )}
          </text>
        )}
      </svg>

      <ul className="flex flex-col gap-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: seg.color }}
            />
            <span className="text-[12px]" style={{ color: "var(--list-text)" }}>
              {seg.label}
            </span>
            <span
              className="text-[12px] font-semibold"
              style={{ color: "var(--kpi-label)", fontFamily: "'DM Mono', monospace" }}
            >
              {seg.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
