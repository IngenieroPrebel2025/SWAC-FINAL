"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { useOverlayStack } from "@/hooks/useOverlayStack";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Identificador del elemento afectado, mostrado en un bloque destacado. */
  itemName?: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  itemName,
  confirmLabel = "Confirmar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = React.useId();
  const descId = React.useId();
  useOverlayStack(open, onCancel);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden="true"
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(5,19,38,0.5)", backdropFilter: "blur(4px)" }}
          />
          <div className="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className="pointer-events-auto w-full max-w-[420px] rounded-xl border p-6"
              style={{
                background: "var(--card-menu-dd-bg)",
                borderColor: "var(--card-border)",
                boxShadow: "0 24px 64px rgba(5,19,38,0.28)",
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                {variant === "danger" && (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--kpi-icon-warn-bg)", color: "var(--atom-coral-500)" }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={18} strokeWidth={2} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="Cancelar"
                  className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                  style={{ borderColor: "var(--ctrl-border)", color: "var(--kpi-label)", background: "transparent" }}
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>

              <h2 id={titleId} className="mb-1.5 text-[15px] font-semibold" style={{ color: "var(--sect-title)" }}>
                {title}
              </h2>
              <p id={descId} className="mb-4 text-[12.5px] leading-relaxed" style={{ color: "var(--sect-sub)" }}>
                {description}
              </p>

              {itemName && (
                <div
                  className="mb-5 rounded-lg border px-3 py-2.5"
                  style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--kpi-label)" }}>
                    Elemento afectado
                  </span>
                  <span className="mt-0.5 block break-all text-[12.5px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                    {itemName}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant={variant === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
