import * as React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertConfig {
  Icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
}

const CONFIG: Record<AlertVariant, AlertConfig> = {
  info: {
    Icon: Info,
    bg: "rgba(101,149,191,0.10)",
    border: "rgba(101,149,191,0.30)",
    iconColor: "var(--atom-blue-500)",
    titleColor: "var(--atom-blue-500)",
  },
  success: {
    Icon: CheckCircle2,
    bg: "rgba(114,166,137,0.10)",
    border: "rgba(114,166,137,0.30)",
    iconColor: "var(--atom-green-500)",
    titleColor: "var(--atom-green-500)",
  },
  warning: {
    Icon: AlertCircle,
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.28)",
    iconColor: "#d97706",
    titleColor: "#b45309",
  },
  error: {
    Icon: XCircle,
    bg: "rgba(242,125,114,0.10)",
    border: "rgba(242,125,114,0.30)",
    iconColor: "var(--atom-coral-500)",
    titleColor: "var(--atom-coral-500)",
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = "info", title, children, onClose, className }: AlertProps) {
  const { Icon, bg, border, iconColor, titleColor } = CONFIG[variant];

  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border p-3.5", className)}
      style={{ background: bg, borderColor: border }}
    >
      <Icon size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0" style={{ color: iconColor }} />
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-0.5 text-[13px] font-semibold" style={{ color: titleColor }}>
            {title}
          </p>
        )}
        {children && (
          <div className="text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar alerta"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded opacity-60 transition-opacity hover:opacity-100"
          style={{ color: "var(--ctrl-text)" }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
