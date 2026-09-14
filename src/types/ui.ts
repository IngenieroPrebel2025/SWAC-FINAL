import type { LucideIcon } from "lucide-react";

/** Grid vs table presentation for collection views. */
export type ViewMode = "grid" | "list";

/** Visual status tone used by StatusBadge and data tables. */
export type StatusTone = "active" | "warning" | "maintenance" | "inactive";

/** KPI summary tile descriptor. */
export interface Kpi {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down";
  trendValue?: string;
  iconBg: string;
  iconColor: string;
  /** Optional 0–100 progress bar rendered under the value. */
  progress?: number;
  progressColor?: string;
}
