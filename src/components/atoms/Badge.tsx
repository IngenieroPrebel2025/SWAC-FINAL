import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded font-medium whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
      },
      tone: {
        blue:  "bg-[var(--kpi-icon-info-bg)]  text-[var(--kpi-icon-info-color)]",
        green: "bg-[var(--kpi-icon-pos-bg)]   text-[var(--kpi-icon-pos-color)]",
        coral: "bg-[var(--kpi-icon-warn-bg)]  text-[var(--kpi-icon-warn-color)]",
        slate: "bg-[var(--chip-count-bg)]     text-[var(--chip-count-text)]",
        amber: "bg-[var(--tone-amber-bg)]     text-[var(--tone-amber-color)]",
        navy:  "bg-[var(--tone-navy-bg)]      text-[var(--tone-navy-color)]",
      },
    },
    defaultVariants: { size: "md", tone: "blue" },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, size, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ size, tone }), className)} {...props} />
  );
}
