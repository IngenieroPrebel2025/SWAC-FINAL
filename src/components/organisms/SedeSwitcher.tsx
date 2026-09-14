"use client";

import { Check, ChevronDown, Lock, MapPin } from "lucide-react";
import { Dropdown } from "@/components/molecules/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";

/** Selector de sede operativa activa (multi-sede) o indicador de sede fijada por perfil. */
export function SedeSwitcher() {
  const { activeSede, availableSedes, hasMultipleSedes, setActiveSedeId, isGlobalAdmin } = useAuth();
  if (!activeSede) return null;

  const label = (
    <>
      <MapPin size={14} strokeWidth={1.8} className="shrink-0" style={{ color: "var(--atom-blue-500)" }} />
      <span className="hidden max-w-[150px] truncate text-[12.5px] font-medium md:inline" style={{ color: "var(--hd-user-title)" }}>
        {activeSede.nombre}
      </span>
    </>
  );

  if (!hasMultipleSedes) {
    return (
      <div
        title="Sede fijada por el perfil de aislamiento operacional"
        className="flex h-8 items-center gap-1.5 rounded-lg border px-2"
        style={{ borderColor: "var(--hd-divider)" }}
      >
        {label}
        <Lock size={11} strokeWidth={2} style={{ color: "var(--hd-icon-color)" }} aria-label="Sede fijada" />
      </div>
    );
  }

  return (
    <Dropdown
      width={290}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Sede activa: ${activeSede.nombre}. Cambiar sede`}
          className="flex h-8 items-center gap-1.5 rounded-lg border px-2 transition-colors hover:bg-[var(--hd-user-bg-hover)]"
          style={{ borderColor: "var(--hd-divider)", cursor: "pointer" }}
        >
          {label}
          <ChevronDown size={12} strokeWidth={2} style={{ color: "var(--hd-icon-color)" }} aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1.5">
          <div
            className="flex items-center justify-between px-3 pb-2 pt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ color: "var(--kpi-label)", borderBottom: "1px solid var(--card-divider)" }}
          >
            <span>Sedes autorizadas ({availableSedes.length})</span>
            {isGlobalAdmin && <span style={{ color: "var(--atom-blue-500)" }}>Acceso total</span>}
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {availableSedes.map((sede) => {
              const active = sede.id === activeSede.id;
              return (
                <li key={sede.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setActiveSedeId(sede.id);
                      toast.info(`Sede operativa activa: ${sede.nombre}`);
                      close();
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--card-menu-item-hover)]"
                    style={{ background: active ? "var(--chip-bg-active)" : "transparent" }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium" style={{ color: "var(--card-menu-item)" }}>
                        {sede.nombre}
                      </span>
                      <span className="block text-[11px]" style={{ color: "var(--hd-user-sub)" }}>
                        {sede.ciudad} · {sede.codigo}
                      </span>
                    </span>
                    {active && <Check size={14} strokeWidth={2.2} style={{ color: "var(--atom-blue-500)" }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Dropdown>
  );
}
