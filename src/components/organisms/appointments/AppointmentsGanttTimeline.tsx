"use client";

import { ChevronLeft, ChevronRight, Info, Snowflake, Truck } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { formatIsoHour, shiftIsoDate, todayIso } from "@/lib/format";
import { ESTADO_CITA, ESTADO_MUELLE, TONE_SOLID } from "@/lib/status";
import type { Cita, EstadoCita, Muelle, Proveedor, Sede, Vehiculo } from "@/types";
import { useState } from "react";

const HORAS = Array.from({ length: 16 }, (_, i) => `${String(6 + i).padStart(2, "0")}:00`);
const SPAN_MIN = 16 * 60;

type DockFilter = "TODOS" | "FRIO" | "SECOS";

interface AppointmentsGanttTimelineProps {
  citas: Cita[];
  muelles: Muelle[];
  sedes: Sede[];
  proveedores: Proveedor[];
  vehiculos: Vehiculo[];
  sedeId: string;
  fecha: string;
  onFechaChange: (fecha: string) => void;
  onSedeChange: (sedeId: string) => void;
  onOpenCita: (cita: Cita) => void;
  onNewAtSlot?: (slot: { muelleId: string; horaInicio: string }) => void;
}

const esFrio = (m: Muelle) => m.materialesPermitidos.includes("REFRIGERADOS") || m.materialesPermitidos.includes("CONGELADOS");

function leftPct(iso: string) {
  const [h, m] = formatIsoHour(iso).split(":").map(Number);
  return Math.max(0, Math.min(96, (((h || 6) - 6) * 60 + (m || 0)) / SPAN_MIN * 100));
}

const widthPct = (min?: number) => Math.max(4, Math.min(100, ((min && min > 0 ? min : 60) / SPAN_MIN) * 100));

/** Cronograma de muelles (06:00–22:00) con bloques de citas y agendamiento directo por celda. */
export function AppointmentsGanttTimeline({
  citas,
  muelles,
  sedes,
  proveedores,
  vehiculos,
  sedeId,
  fecha,
  onFechaChange,
  onSedeChange,
  onOpenCita,
  onNewAtSlot,
}: AppointmentsGanttTimelineProps) {
  const [dockFilter, setDockFilter] = useState<DockFilter>("TODOS");
  const today = todayIso();
  const tomorrow = shiftIsoDate(today, 1);

  const muellesVisibles = muelles.filter((m) =>
    dockFilter === "FRIO" ? esFrio(m) : dockFilter === "SECOS" ? !esFrio(m) : true
  );
  const citasDia = citas.filter((c) => c.fechaCita === fecha);
  const count = (estados: EstadoCita[]) => citasDia.filter((c) => estados.includes(c.estado)).length;

  return (
    <Surface className="overflow-hidden">
      {/* Controles */}
      <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between" style={{ borderColor: "var(--card-divider)" }}>
        <div className="flex flex-wrap items-center gap-2">
          {sedes.length > 1 && (
            <div className="w-48">
              <Select value={sedeId} onChange={(e) => onSedeChange(e.target.value)} aria-label="Sede">
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex items-center gap-1">
            <IconButton label="Día anterior" onClick={() => onFechaChange(shiftIsoDate(fecha, -1))}>
              <ChevronLeft size={16} />
            </IconButton>
            <Input type="date" aria-label="Fecha del cronograma" value={fecha} onChange={(e) => e.target.value && onFechaChange(e.target.value)} className="h-8 w-[150px] text-[12px]" />
            <IconButton label="Día siguiente" onClick={() => onFechaChange(shiftIsoDate(fecha, 1))}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
          <SegmentedControl<string>
            ariaLabel="Fecha rápida"
            value={fecha === today ? "HOY" : fecha === tomorrow ? "MANANA" : ""}
            onChange={(v) => onFechaChange(v === "HOY" ? today : tomorrow)}
            options={[
              { value: "HOY", label: "Hoy" },
              { value: "MANANA", label: "Mañana" },
            ]}
          />
        </div>
        <SegmentedControl<DockFilter>
          ariaLabel="Tipo de muelle"
          value={dockFilter}
          onChange={setDockFilter}
          options={[
            { value: "TODOS", label: `Todos (${muelles.length})` },
            { value: "FRIO", label: "Refrigerados", icon: <Snowflake size={12} /> },
            { value: "SECOS", label: "Carga seca" },
          ]}
        />
      </div>

      {/* Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-[12px]" style={{ borderColor: "var(--card-divider)", background: "var(--inset-bg)" }}>
        <div className="flex flex-wrap items-center gap-4" style={{ color: "var(--sect-sub)" }}>
          {[
            { label: "En muelle", value: count(["EN_MUELLE", "DESCARGANDO"]), color: TONE_SOLID.navy },
            { label: "En portería", value: count(["EN_PORTERIA"]), color: TONE_SOLID.amber },
            { label: "Confirmadas", value: count(["CONFIRMADA"]), color: TONE_SOLID.blue },
            { label: "Completadas", value: count(["COMPLETADA"]), color: TONE_SOLID.green },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}: <strong style={{ color: "var(--list-text)" }}>{s.value}</strong>
            </span>
          ))}
        </div>
        {onNewAtSlot && (
          <span className="flex items-center gap-1 text-[11.5px]" style={{ color: "var(--atom-blue-500)" }}>
            <Info size={13} /> Haz clic en una celda libre para agendar en ese muelle y horario.
          </span>
        )}
      </div>

      {/* Matriz */}
      <div className="scrollbar-thin overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="flex border-b text-[10.5px] font-semibold" style={{ borderColor: "var(--card-divider)", background: "var(--list-header-bg)", color: "var(--list-header-text)", fontFamily: "var(--font-mono)" }}>
            <div className="w-52 shrink-0 border-r px-4 py-2.5 uppercase tracking-[0.07em]" style={{ borderColor: "var(--card-divider)", fontFamily: "var(--font-sans)" }}>
              Muelle
            </div>
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${HORAS.length}, minmax(0, 1fr))` }}>
              {HORAS.map((h) => (
                <div key={h} className="border-r py-2.5 text-center last:border-r-0" style={{ borderColor: "var(--list-row-divider)" }}>
                  {h}
                </div>
              ))}
            </div>
          </div>

          {muellesVisibles.length === 0 ? (
            <p className="py-14 text-center text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
              No hay muelles para el filtro seleccionado en esta sede.
            </p>
          ) : (
            muellesVisibles.map((muelle) => {
              const estado = ESTADO_MUELLE[muelle.estadoActual];
              return (
                <div key={muelle.id} className="flex min-h-[76px] border-b" style={{ borderColor: "var(--list-row-divider)" }}>
                  <div className="flex w-52 shrink-0 flex-col justify-center gap-0.5 border-r px-4 py-2" style={{ borderColor: "var(--card-divider)", background: "var(--inset-bg)" }}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                        {muelle.codigoMuelle}
                        {esFrio(muelle) && <Snowflake size={12} style={{ color: "var(--atom-blue-500)" }} aria-label="Cadena de frío" />}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: estado.status === "active" ? "var(--st-active-color)" : estado.status === "warning" ? "var(--st-warning-color)" : "var(--st-maint-color)" }}>
                        {estado.label}
                      </span>
                    </span>
                    <span className="truncate text-[11px]" style={{ color: "var(--list-text-sub)" }} title={muelle.nombre}>
                      {muelle.nombre}
                    </span>
                  </div>

                  <div className="relative grid flex-1" style={{ gridTemplateColumns: `repeat(${HORAS.length}, minmax(0, 1fr))` }}>
                    {HORAS.map((h) =>
                      onNewAtSlot ? (
                        <button
                          key={h}
                          type="button"
                          aria-label={`Agendar en ${muelle.codigoMuelle} a las ${h}`}
                          onClick={() => onNewAtSlot({ muelleId: muelle.id, horaInicio: h })}
                          className="group/slot relative h-full border-r transition-colors last:border-r-0 hover:bg-[var(--chip-bg-active)]"
                          style={{ borderColor: "var(--list-row-divider)" }}
                        >
                          <span className="absolute left-1 top-1 hidden rounded px-1 text-[9.5px] font-medium group-hover/slot:block" style={{ color: "var(--atom-blue-500)", fontFamily: "var(--font-mono)" }}>
                            + {h}
                          </span>
                        </button>
                      ) : (
                        <div key={h} className="h-full border-r last:border-r-0" style={{ borderColor: "var(--list-row-divider)" }} />
                      )
                    )}

                    {citasDia
                      .filter((c) => c.muelleId === muelle.id)
                      .map((cita) => {
                        const info = ESTADO_CITA[cita.estado];
                        const prov = proveedores.find((p) => p.id === cita.proveedorId);
                        const veh = vehiculos.find((v) => v.id === cita.vehiculoId);
                        const inactive = cita.estado === "CANCELADA" || cita.estado === "RECHAZADA";
                        return (
                          <button
                            key={cita.id}
                            type="button"
                            onClick={() => onOpenCita(cita)}
                            title={`${cita.codigoCita} · ${info.label} · ${formatIsoHour(cita.tiempos.horaProgramadaInicio)}–${formatIsoHour(cita.tiempos.horaProgramadaFin)}`}
                            className="absolute bottom-1.5 top-1.5 z-10 flex flex-col justify-between overflow-hidden rounded-lg px-2 py-1.5 text-left text-white shadow-sm transition-transform hover:z-20 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            style={{
                              left: `${leftPct(cita.tiempos.horaProgramadaInicio)}%`,
                              width: `${widthPct(cita.tiempos.duracionEstimadaMinutos)}%`,
                              background: TONE_SOLID[info.tone],
                              opacity: inactive ? 0.55 : 1,
                            }}
                          >
                            <span className="flex items-center justify-between gap-1 text-[11px] font-bold leading-none">
                              <span className="truncate" style={{ fontFamily: "var(--font-mono)" }}>
                                {cita.codigoCita}
                              </span>
                              <span className="rounded bg-black/20 px-1 text-[9.5px]">{cita.tiempos.duracionEstimadaMinutos}m</span>
                            </span>
                            <span className="flex items-center gap-1 truncate text-[10px] opacity-95">
                              <Truck size={11} className="shrink-0" />
                              {veh?.placa ?? "—"} · {prov?.nombreComercial ?? "Proveedor"}
                            </span>
                            <span className="truncate text-[9.5px] font-semibold uppercase opacity-90">{info.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11.5px]" style={{ color: "var(--sect-sub)" }}>
        <div className="flex flex-wrap items-center gap-3">
          {(["SOLICITADA", "CONFIRMADA", "EN_PORTERIA", "DESCARGANDO", "COMPLETADA", "CANCELADA"] as EstadoCita[]).map((e) => (
            <span key={e} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: TONE_SOLID[ESTADO_CITA[e].tone] }} />
              {ESTADO_CITA[e].label}
            </span>
          ))}
        </div>
        <span style={{ color: "var(--result-text)" }}>Ventana operativa de 16 horas (06:00 – 22:00)</span>
      </div>
    </Surface>
  );
}
