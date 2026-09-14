"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function RadioGroup({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  orientation = "vertical",
  className,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (optValue: string) => {
    if (!isControlled) setInternalValue(optValue);
    onChange?.(optValue);
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col gap-2.5" : "flex-row flex-wrap gap-4",
        className
      )}
    >
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "inline-flex cursor-pointer select-none items-start gap-2.5",
              opt.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="relative mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => !opt.disabled && handleChange(opt.value)}
                disabled={opt.disabled}
                className="sr-only"
              />
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-colors",
                  checked
                    ? "border-[var(--radio-checked)]"
                    : "border-[var(--ctrl-border)] bg-[var(--ctrl-bg)]"
                )}
              />
              {checked && (
                <span
                  className="absolute h-[7px] w-[7px] rounded-full"
                  style={{ background: "var(--radio-checked)" }}
                />
              )}
            </span>
            <span>
              <span className="block text-[13px]" style={{ color: "var(--list-text)" }}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--kpi-label)" }}>
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
