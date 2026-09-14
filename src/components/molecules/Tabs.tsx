"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  /* Scoped layoutId so several Tabs on screen (page + modal) animate independently. */
  const layoutId = `tabs-indicator-${React.useId()}`;

  return (
    <div className={cn("scrollbar-none max-w-full overflow-x-auto", className)}>
      <div
        role="tablist"
        className="inline-flex gap-0.5 rounded-lg p-1"
        style={{
          background: "var(--ctrl-bg)",
          border: "1px solid var(--ctrl-border)",
        }}
      >
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.value)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atom-blue-500)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !active && "hover:bg-[var(--sb-item-bg-hover)]"
              )}
              style={{ color: active ? "var(--sb-item-text-active)" : "var(--sb-item-text)" }}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  aria-hidden="true"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-md"
                  style={{
                    background: "var(--nav-glow-grad)",
                    border: "1px solid var(--nav-glow-border)",
                    boxShadow: "var(--nav-glow-shadow)",
                    zIndex: 0,
                  }}
                />
              )}
              <span className="relative z-[1] flex items-center gap-1.5">
                {item.icon}
                {item.label}
                {item.badge !== undefined && (
                  <span
                    className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: "var(--chip-bg-active)",
                      color: "var(--atom-blue-500)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TabsPanelProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsPanel({ value, activeValue, children, className }: TabsPanelProps) {
  if (value !== activeValue) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
