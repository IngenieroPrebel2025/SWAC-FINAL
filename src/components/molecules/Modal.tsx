"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useOverlayStack } from "@/hooks/useOverlayStack";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Extra header actions rendered before the close button. */
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  bodyClassName?: string;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  actions,
  size = "md",
  className,
  bodyClassName,
}: ModalProps) {
  const titleId = React.useId();
  useOverlayStack(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(5,19,38,0.55)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col rounded-2xl sm:max-h-[calc(100dvh-2rem)]",
                SIZE_CLASS[size],
                className
              )}
              style={{
                background: "var(--card-menu-dd-bg)",
                border: "1px solid var(--card-border)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.28), var(--card-shadow)",
              }}
            >
              {(title || description || actions) && (
                <div
                  className="flex shrink-0 items-start justify-between gap-4 border-b p-5"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <div className="min-w-0">
                    {title && (
                      <h2 id={titleId} className="text-[15px] font-semibold" style={{ color: "var(--sect-title)" }}>
                        {title}
                      </h2>
                    )}
                    {description && (
                      <div className="mt-1 text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
                        {description}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {actions}
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar diálogo"
                      className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--sb-item-bg-hover)]"
                      style={{ color: "var(--ctrl-text)" }}
                    >
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {children && (
                <div className={cn("scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5", bodyClassName)}>{children}</div>
              )}

              {footer && (
                <div
                  className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t p-4"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
