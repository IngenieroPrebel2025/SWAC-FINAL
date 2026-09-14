"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { InfoTile } from "@/components/molecules/InfoTile";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useRegistrarLogDisponibilidad } from "@/hooks/useSedesMuelles";
import { todayIso } from "@/lib/format";
import { TIPO_MUELLE } from "@/lib/status";
import type { Muelle, Sede } from "@/types";

interface ShiftsMatrixProps {
  muelles: Muelle[];
  sede?: Sede | null;
  usuarioId: string;
  canEdit: boolean;
}

/** Matriz de habilitación de cada muelle por franja horaria. */
export function ShiftsMatrix({ muelles, sede, usuarioId, canEdit }: ShiftsMatrixProps) {
  const [fecha, setFecha] = useState(todayIso());
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const registrar = useRegistrarLogDisponibilidad();

  const horas = useMemo(() => {
    const apertura = parseInt((sede?.horarioApertura ?? "06:00").split(":")[0], 10);
    const cierre = parseInt((sede?.horarioCierre ?? "22:00").split(":")[0], 10);
    return Array.from({ length: Math.max(1, cierre - apertura) }, (_, i) => `${String(apertura + i).padStart(2, "0")}:00`);
  }, [sede]);

  const handleToggle = (muelle: Muelle, hora: string, activo: boolean) => {
    const key = `${muelle.id}-${fecha}-${hora}`;
    setToggles((prev) => ({ ...prev, [key]: !activo }));
    registrar.mutate({
      muelleId: muelle.id,
      sedeId: muelle.sedeId,
      fecha,
      horaInicio: hora,
      horaFin: `${String(parseInt(hora, 10) + 1).padStart(2, "0")}:00`,
      estadoHabilitado: !activo,
      motivoCambio: !activo ? `Franja ${hora} habilitada manualmente` : `Franja ${hora} deshabilitada por supervisor`,
      usuarioId,
    });
  };

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 p-5">
        <SectionHeading
          title="Habilitación por turnos y horarios"
          description="Disponibilidad de cada muelle por franja horaria para la fecha seleccionada."
          actions={
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--sect-sub)" }}>
              <CalendarDays size={14} />
              <Input type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} className="h-8 w-[160px] text-[12px]" />
            </label>
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Turno 1 · Mañana" value="06:00 – 14:00" hint="Recepción y materias primas" mono />
          <InfoTile label="Turno 2 · Tarde" value="14:00 – 22:00" hint="Cross-docking y paquetería" mono />
          <InfoTile label="Turno 3 · Noche" value="22:00 – 06:00" hint="Despachos interdepartamentales" mono />
        </div>
      </Surface>

      {muelles.length === 0 ? (
        <EmptyState title="Sin muelles en la sede" description="Registra muelles para gestionar sus franjas." />
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ background: "var(--list-bg)", borderColor: "var(--list-border)" }}>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">Franjas habilitadas por muelle</caption>
              <thead>
                <tr style={{ background: "var(--list-header-bg)" }}>
                  <th scope="col" className="sticky left-0 z-[1] px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--list-header-text)", background: "var(--card-menu-dd-bg)" }}>
                    Muelle
                  </th>
                  {horas.map((h) => (
                    <th key={h} scope="col" className="px-1 py-2.5 text-center text-[10.5px] font-semibold" style={{ color: "var(--list-header-text)", fontFamily: "var(--font-mono)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {muelles.map((muelle) => {
                  const fuera = muelle.estadoActual === "MANTENIMIENTO" || muelle.estadoActual === "INACTIVO";
                  return (
                    <tr key={muelle.id} style={{ borderTop: "1px solid var(--list-row-divider)" }}>
                      <th scope="row" className="sticky left-0 z-[1] px-4 py-2.5 text-left font-normal" style={{ background: "var(--card-menu-dd-bg)" }}>
                        <span className="block text-[12.5px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                          {muelle.codigoMuelle}
                        </span>
                        <Badge size="sm" tone={TIPO_MUELLE[muelle.tipo].tone}>
                          {TIPO_MUELLE[muelle.tipo].label}
                        </Badge>
                      </th>
                      {horas.map((hora) => {
                        const key = `${muelle.id}-${fecha}-${hora}`;
                        const activo = toggles[key] ?? !fuera;
                        return (
                          <td key={hora} className="px-1 py-2 text-center">
                            <button
                              type="button"
                              disabled={!canEdit}
                              aria-pressed={activo}
                              aria-label={`${muelle.codigoMuelle} ${hora}: ${activo ? "habilitado" : "deshabilitado"}`}
                              onClick={() => handleToggle(muelle, hora, activo)}
                              className="mx-auto flex h-8 w-9 items-center justify-center rounded-md border text-[10px] font-bold transition-colors disabled:cursor-not-allowed"
                              style={{
                                fontFamily: "var(--font-mono)",
                                background: activo ? "var(--st-active-bg)" : "var(--chip-count-bg)",
                                borderColor: activo ? "rgba(114,166,137,0.35)" : "var(--ctrl-border)",
                                color: activo ? "var(--st-active-color)" : "var(--list-text-sub)",
                                textDecoration: activo ? "none" : "line-through",
                              }}
                            >
                              {activo ? "ON" : "OFF"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
