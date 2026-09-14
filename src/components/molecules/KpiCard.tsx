import { TrendingUp, TrendingDown } from "lucide-react";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import type { Kpi } from "@/types/ui";

interface KpiCardProps {
  kpi: Kpi;
}

export function KpiCard({ kpi }: KpiCardProps) {
  const { icon: Icon, label, value, subValue, trend, trendValue, iconBg, iconColor, progress, progressColor } = kpi;

  return (
    <article
      style={{
        background: "var(--kpi-bg)",
        backdropFilter: "var(--kpi-blur)",
        WebkitBackdropFilter: "var(--kpi-blur)",
        border: "1px solid var(--kpi-border)",
        borderRadius: 10,
        boxShadow: "var(--kpi-shadow)",
        padding: "18px 20px",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--kpi-label)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            flexShrink: 0,
          }}
        >
          <Icon size={14} strokeWidth={1.75} />
        </div>
      </div>

      {/* Value */}
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "var(--kpi-value)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {value}
        </div>
        {subValue && (
          <div className="truncate" style={{ fontSize: 11.5, color: "var(--kpi-sub)", marginTop: 4 }}>
            {subValue}
          </div>
        )}
      </div>

      {progress !== undefined && <ProgressBar value={progress} color={progressColor} label={label} />}

      {/* Trend */}
      {trendValue && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            paddingTop: 10,
            borderTop: "1px solid var(--kpi-divider)",
          }}
        >
          <span
            style={{
              color: trend === "up" ? "var(--kpi-trend-up)" : "var(--kpi-trend-down)",
              display: "flex",
            }}
            aria-hidden="true"
          >
            {trend === "up" ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: trend === "up" ? "var(--kpi-trend-up)" : "var(--kpi-trend-down)",
            }}
          >
            {trendValue}
          </span>
        </div>
      )}
    </article>
  );
}
