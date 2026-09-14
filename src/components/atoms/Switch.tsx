"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  id?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: "sm" | "md";
}

export function Switch({
  id,
  name,
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled,
  label,
  description,
  size = "md",
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e.target.checked);
  };

  const isSm = size === "sm";

  const track = (
    <span
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        isSm ? "h-4 w-7" : "h-5 w-9",
        checked ? "bg-[var(--atom-navy-700)]" : "bg-[var(--ctrl-border)]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="checkbox"
        role="switch"
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-checked={checked}
        className="sr-only"
      />
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200",
          isSm ? "h-3 w-3" : "h-4 w-4",
          checked ? (isSm ? "translate-x-3" : "translate-x-4") : "translate-x-0"
        )}
      />
    </span>
  );

  if (label || description) {
    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex cursor-pointer select-none items-start gap-3",
          disabled && "cursor-not-allowed"
        )}
      >
        <span className="mt-0.5">{track}</span>
        <span>
          {label && (
            <span className="block text-[13px] font-medium" style={{ color: "var(--list-text)" }}>
              {label}
            </span>
          )}
          {description && (
            <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--kpi-label)" }}>
              {description}
            </span>
          )}
        </span>
      </label>
    );
  }

  return track;
}
