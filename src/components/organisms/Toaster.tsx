"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast, type ToastMessage, type ToastType } from "@/store/slices/toastSlice";

const CONFIG: Record<ToastType, { Icon: typeof Info; color: string }> = {
  success: { Icon: CheckCircle2, color: "var(--atom-green-500)" },
  error: { Icon: AlertCircle, color: "var(--atom-coral-500)" },
  warning: { Icon: AlertTriangle, color: "var(--atom-amber-500)" },
  info: { Icon: Info, color: "var(--atom-blue-500)" },
};

const DURATION_MS = 4200;

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dispatch = useAppDispatch();
  const { Icon, color } = CONFIG[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), DURATION_MS);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      role={toast.type === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border p-3.5"
      style={{
        background: "var(--card-menu-dd-bg)",
        borderColor: "var(--card-menu-dd-border)",
        boxShadow: "var(--card-menu-dd-shadow)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <Icon size={16} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color }} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed" style={{ color: "var(--list-text)" }}>
        {toast.text}
      </p>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        aria-label="Cerrar notificación"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-60 transition-opacity hover:opacity-100"
        style={{ color: "var(--ctrl-text)" }}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </motion.div>
  );
}

/** Pila de notificaciones efímeras (alimentada por `lib/toast`). */
export function Toaster() {
  const toasts = useAppSelector((s) => s.toast.active);

  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed right-3 top-[72px] z-[100] flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
