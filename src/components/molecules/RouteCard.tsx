import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NavLeaf } from "@/config/navigation";

export function RouteCard({ route }: { route: NavLeaf }) {
  const Icon = route.icon;
  return (
    <Link
      href={route.href}
      className="group relative flex items-start gap-3.5 rounded-xl border border-[var(--card-border)] p-4 no-underline shadow-[var(--card-shadow)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--card-border-hover)] hover:shadow-[var(--card-shadow-hover)]"
      style={{
        background: "var(--card-bg)",
        backdropFilter: "var(--card-blur)",
        WebkitBackdropFilter: "var(--card-blur)",
      }}
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "var(--kpi-icon-info-bg)", color: "var(--kpi-icon-info-color)" }}
      >
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-semibold" style={{ color: "var(--card-title)" }}>
            {route.label}
          </span>
          <ArrowRight
            size={13}
            strokeWidth={2}
            aria-hidden="true"
            className="opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            style={{ color: "var(--atom-blue-500)" }}
          />
        </div>
        {route.description && (
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--card-desc)" }}>
            {route.description}
          </p>
        )}
      </div>
    </Link>
  );
}
