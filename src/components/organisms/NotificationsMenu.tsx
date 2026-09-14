"use client";

import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Info } from "lucide-react";
import { Dropdown } from "@/components/molecules/Dropdown";
import { IconButton } from "@/components/atoms/IconButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearNotifications, markAllNotificationsRead, type ToastType } from "@/store/slices/toastSlice";
import { formatRelative } from "@/lib/format";

const TYPE_CONFIG: Record<ToastType, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: "var(--atom-green-500)" },
  warning: { icon: AlertTriangle, color: "var(--atom-amber-500)" },
  error: { icon: AlertCircle, color: "var(--atom-coral-500)" },
  info: { icon: Info, color: "var(--atom-blue-500)" },
};

/** Actividad reciente de la sesión (historial de notificaciones del sistema). */
export function NotificationsMenu() {
  const dispatch = useAppDispatch();
  const history = useAppSelector((s) => s.toast.history);
  const unreadCount = history.filter((n) => !n.read).length;

  return (
    <Dropdown
      width={340}
      trigger={(props) => (
        <IconButton label={`Notificaciones${unreadCount ? ` (${unreadCount} sin leer)` : ""}`} {...props}>
          <span className="relative flex">
            <Bell size={15} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--hd-notif-dot)" }}
              />
            )}
          </span>
        </IconButton>
      )}
    >
      {() => (
        <div>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--card-divider)" }}
          >
            <span className="text-[13px] font-semibold" style={{ color: "var(--sect-title)" }}>
              Actividad reciente
            </span>
            {unreadCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "var(--sb-badge-bg)", color: "var(--sb-badge-text)" }}
              >
                {unreadCount} nuevas
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px]" style={{ color: "var(--sect-sub)" }}>
              Sin actividad en esta sesión.
            </p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {history.map((n) => {
                const { icon: Icon, color } = TYPE_CONFIG[n.type];
                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{ background: n.read ? "transparent" : "var(--chip-bg-active)" }}
                  >
                    <Icon size={14} strokeWidth={2} className="mt-0.5 flex-shrink-0" style={{ color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] leading-relaxed" style={{ color: "var(--sect-title)" }}>
                        {n.text}
                      </span>
                      <span className="mt-1 block text-[11px]" style={{ color: "var(--result-text)" }}>
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div
            className="flex items-center justify-between px-4 py-2.5 text-[12px]"
            style={{ borderTop: "1px solid var(--card-divider)" }}
          >
            <button
              type="button"
              onClick={() => dispatch(markAllNotificationsRead())}
              disabled={unreadCount === 0}
              className="font-medium disabled:opacity-40"
              style={{ color: "var(--atom-blue-500)" }}
            >
              Marcar como leídas
            </button>
            <button
              type="button"
              onClick={() => dispatch(clearNotifications())}
              disabled={history.length === 0}
              className="disabled:opacity-40"
              style={{ color: "var(--sect-sub)" }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}
