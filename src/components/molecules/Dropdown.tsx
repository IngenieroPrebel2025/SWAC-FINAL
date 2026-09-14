"use client";

import * as React from "react";
import { useRef, useEffect, useState, useId } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  /** Trigger element — receives onClick + aria attributes. */
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    id: string;
  }) => React.ReactNode;
  /** Dropdown content. Receives a close() helper. */
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  width?: number;
  className?: string;
}

/**
 * Accessible click-dropdown: outside-click + Escape close, focus-safe.
 * Used by the notifications panel and the user menu.
 */
export function Dropdown({
  trigger,
  children,
  align = "end",
  width = 280,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({
        onClick: () => setOpen((o) => !o),
        "aria-expanded": open,
        "aria-haspopup": "menu",
        id,
      })}

      {open && (
        <div
          role="menu"
          aria-labelledby={id}
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl",
            "border border-[var(--card-menu-dd-border)] bg-[var(--card-menu-dd-bg)]",
            "shadow-[var(--card-menu-dd-shadow)]",
            "origin-top animate-[dropdown_140ms_ease-out]",
            align === "end" ? "right-0" : "left-0",
            className
          )}
          style={{ width, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
