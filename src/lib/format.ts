/** Fecha local en formato ISO corto `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayIso = () => toIsoDate(new Date());

export function shiftIsoDate(iso: string, days: number): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : todayIso();
  const [y, m, d] = base.split("-").map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

/** `2026-02-27T08:00:00Z` → `08:00`; `08:00` → `08:00`. */
export function formatIsoHour(value?: string): string {
  if (!value) return "--:--";
  if (value.includes("T")) return value.split("T")[1].slice(0, 5);
  return value.slice(0, 5);
}

/** `2026-08-01` → `1 ago 2026`. */
export function formatFriendlyDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hace un momento";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d !== 1 ? "s" : ""}`;
}

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("es-CO", { maximumFractionDigits: digits });

/** `EN_PORTERIA` → `En porteria`. */
export function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Carlos Eduardo Montoya" → "CM". */
export function getInitials(nombre: string): string {
  const parts = nombre.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
