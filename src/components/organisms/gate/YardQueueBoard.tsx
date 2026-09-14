"use client";

import { useState } from "react";
import { BellRing, Check, CheckCircle2, Clock, LogOut, Play, Radio, Smartphone, Timer, Trash2, Truck } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { KpiCard } from "@/components/molecules/KpiCard";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { useAvanzarTurno, useCancelarTurno, useLlamarAMuelle, type AccionTurno } from "@/hooks/usePorteria";
import { ESTADO_TURNO } from "@/lib/status";
import { toast } from "@/lib/toast";
import type { Kpi, Muelle, TurnoPatio } from "@/types";

interface YardQueueBoardProps {
  turnos: TurnoPatio[];
  muelles: Muelle[];
  loading?: boolean;
  onCheckout: (turno: TurnoPatio) => void;
  onDriverPass: (codigoCita: string) => void;
}

const ACCION_MENSAJE: Record<AccionTurno, (t: TurnoPatio) => string> = {
  posicionar: (t) => `Vehículo ${t.vehiculoPlaca} posicionado y acoplado en bahía.`,
  iniciar: (t) => `Descargue iniciado en ${t.muelleAsignadoNombre}.`,
  finalizar: (t) => `Descargue completado. ${t.vehiculoPlaca} habilitado para salida.`,
};

/** Tablero de turnos de patio y llamador a muelles (yard management). */
export function YardQueueBoard({ turnos, muelles, loading, onCheckout, onDriverPass }: YardQueueBoardProps) {
  const [muellePorTurno, setMuellePorTurno] = useState<Record<string, string>>({});
  const [toCancel, setToCancel] = useState<TurnoPatio | null>(null);

  const llamar = useLlamarAMuelle();
  const avanzar = useAvanzarTurno();
  const cancelar = useCancelarTurno();

  const activos = turnos.filter((t) => t.estado !== "SALIDA_REGISTRADA");
  const enEspera = turnos.filter((t) => t.estado === "EN_PATIO_ESPERA");
  const operando = turnos.filter((t) => t.estado === "LLAMADO_A_MUELLE" || t.estado === "EN_MUELLE" || t.estado === "DESCARGANDO");
  const listos = turnos.filter((t) => t.estado === "DESCARGADO_LISTO_SALIDA");
  const promedioEspera = activos.length ? Math.round(activos.reduce((acc, t) => acc + (t.minutosEnEsperaPatio || 0), 0) / activos.length) : 0;

  const kpis: Kpi[] = [
    { icon: Truck, label: "Vehículos en patio", value: String(enEspera.length), subValue: "En espera de bahía", iconBg: "var(--kpi-icon-info-bg)", iconColor: "var(--kpi-icon-info-color)" },
    { icon: Radio, label: "Convocados / en muelle", value: String(operando.length), subValue: "Operando", iconBg: "var(--tone-navy-bg)", iconColor: "var(--tone-navy-color)" },
    { icon: LogOut, label: "Listos para salida", value: String(listos.length), subValue: "Aguardando garita", iconBg: "var(--tone-amber-bg)", iconColor: "var(--tone-amber-color)" },
    {
      icon: Timer,
      label: "Promedio espera patio",
      value: `${promedioEspera} min`,
      subValue: "SLA < 25 min",
      iconBg: promedioEspera <= 25 ? "var(--kpi-icon-pos-bg)" : "var(--kpi-icon-warn-bg)",
      iconColor: promedioEspera <= 25 ? "var(--kpi-icon-pos-color)" : "var(--kpi-icon-warn-color)",
      progress: Math.min(100, (promedioEspera / 25) * 100),
      progressColor: promedioEspera <= 25 ? "var(--solid-green)" : "var(--solid-coral)",
    },
  ];

  const handleLlamar = (turno: TurnoPatio) => {
    const muelleId = muellePorTurno[turno.id] || turno.muelleAsignadoId;
    llamar.mutate(
      { turnoId: turno.id, muelleId },
      { onSuccess: () => toast.success(`Llamado emitido a ${turno.vehiculoPlaca} (${turno.conductorNombre}). Notificación SMS enviada.`) }
    );
  };

  const handleAvanzar = (turno: TurnoPatio, accion: AccionTurno) => {
    avanzar.mutate({ turnoId: turno.id, accion }, { onSuccess: () => toast.success(ACCION_MENSAJE[accion](turno)) });
  };

  const busy = (turnoId: string) =>
    (llamar.isPending && llamar.variables?.turnoId === turnoId) || (avanzar.isPending && avanzar.variables?.turnoId === turnoId);

  return (
    <div className="space-y-4">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <Surface className="overflow-hidden">
        <div className="border-b p-4" style={{ borderColor: "var(--card-divider)" }}>
          <SectionHeading
            icon={<Radio size={13} className="animate-pulse" style={{ color: "var(--atom-green-500)" }} />}
            title="Tablero de turnos en vivo y llamador a muelles"
            description={`${activos.length} vehículos activos en planta`}
          />
        </div>

        {activos.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Truck} title={loading ? "Cargando turnos…" : "Patio despejado"} description={loading ? undefined : "No hay vehículos en el patio de espera."} />
          </div>
        ) : (
          <ul>
            {activos.map((turno) => {
              const info = ESTADO_TURNO[turno.estado];
              const isBusy = busy(turno.id);
              return (
                <li
                  key={turno.id}
                  className="flex flex-col gap-4 border-b p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between"
                  style={{ borderColor: "var(--list-row-divider)" }}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-md border px-2 py-0.5 text-[12px] font-semibold"
                        style={{ background: "var(--code-bg)", borderColor: "var(--code-border)", color: "var(--code-accent)", fontFamily: "var(--font-mono)" }}
                      >
                        {turno.codigoTurno}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                        {turno.vehiculoPlaca}
                      </span>
                      <span className="text-[11.5px]" style={{ color: "var(--list-text-sub)" }}>
                        {turno.codigoCita}
                      </span>
                      <Badge size="sm" tone={info.tone}>
                        {info.label}
                      </Badge>
                      {turno.prioridad === "ALTA" && (
                        <Badge size="sm" tone="coral">
                          Prioridad frío
                        </Badge>
                      )}
                    </div>
                    <div className="grid gap-2 text-[12px] sm:grid-cols-3">
                      <div>
                        <span className="block text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--kpi-label)" }}>
                          Conductor
                        </span>
                        <span className="font-medium" style={{ color: "var(--list-text)" }}>
                          {turno.conductorNombre}
                        </span>
                        <span className="block text-[11px]" style={{ color: "var(--list-text-sub)" }}>
                          {turno.conductorTelefono}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--kpi-label)" }}>
                          Bahía destino
                        </span>
                        <span className="font-medium" style={{ color: "var(--atom-blue-500)" }}>
                          {turno.muelleAsignadoNombre}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--kpi-label)" }}>
                          Tiempo en patio
                        </span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                          <Clock size={12} style={{ color: "var(--solid-amber)" }} /> {turno.minutosEnEsperaPatio || 0} min
                        </span>
                      </div>
                    </div>
                    {turno.observaciones && (
                      <p className="rounded-md px-2 py-1 text-[11.5px] italic" style={{ background: "var(--inset-bg)", color: "var(--sect-sub)" }}>
                        {turno.observaciones}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <Button variant="ghost" size="sm" leftIcon={<Smartphone size={13} />} onClick={() => onDriverPass(turno.codigoCita)}>
                      Pase chofer
                    </Button>

                    {turno.estado === "EN_PATIO_ESPERA" && (
                      <>
                        <div className="w-44">
                          <Select
                            aria-label={`Muelle para ${turno.codigoTurno}`}
                            value={muellePorTurno[turno.id] || turno.muelleAsignadoId}
                            onChange={(e) => setMuellePorTurno((prev) => ({ ...prev, [turno.id]: e.target.value }))}
                          >
                            {muelles.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.codigoMuelle} · {m.nombre}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <Button size="sm" leftIcon={<BellRing size={13} />} loading={isBusy} onClick={() => handleLlamar(turno)}>
                          Llamar a muelle
                        </Button>
                      </>
                    )}
                    {turno.estado === "LLAMADO_A_MUELLE" && (
                      <Button size="sm" leftIcon={<CheckCircle2 size={13} />} loading={isBusy} onClick={() => handleAvanzar(turno, "posicionar")}>
                        Confirmar acople
                      </Button>
                    )}
                    {turno.estado === "EN_MUELLE" && (
                      <Button size="sm" leftIcon={<Play size={13} />} loading={isBusy} onClick={() => handleAvanzar(turno, "iniciar")}>
                        Iniciar descargue
                      </Button>
                    )}
                    {turno.estado === "DESCARGANDO" && (
                      <Button size="sm" leftIcon={<Check size={13} />} loading={isBusy} onClick={() => handleAvanzar(turno, "finalizar")}>
                        Finalizar descargue
                      </Button>
                    )}
                    {turno.estado === "DESCARGADO_LISTO_SALIDA" && (
                      <Button size="sm" leftIcon={<LogOut size={13} />} onClick={() => onCheckout(turno)}>
                        Registrar salida
                      </Button>
                    )}
                    <IconButton label={`Cancelar turno ${turno.codigoTurno}`} onClick={() => setToCancel(turno)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Surface>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="¿Cancelar y remover turno de patio?"
        description="El turno será retirado del tablero de cola y de las llamadas activas a bahía."
        itemName={toCancel ? `${toCancel.codigoTurno} (placa ${toCancel.vehiculoPlaca})` : undefined}
        confirmLabel="Cancelar turno"
        loading={cancelar.isPending}
        onCancel={() => setToCancel(null)}
        onConfirm={() =>
          toCancel &&
          cancelar.mutate(toCancel.id, {
            onSuccess: () => {
              toast.success(`Turno ${toCancel.codigoTurno} cancelado y removido de la cola`);
              setToCancel(null);
            },
          })
        }
      />
    </div>
  );
}
