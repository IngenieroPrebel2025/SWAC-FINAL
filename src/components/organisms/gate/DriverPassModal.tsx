"use client";

import { useEffect, useState } from "react";
import { BellRing, Navigation, PenTool, Phone, QrCode, Search, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { EmptyState } from "@/components/molecules/EmptyState";
import { InfoTile } from "@/components/molecules/InfoTile";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { PageLoader } from "@/components/atoms/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { useDriverSession, useRegistrarLlegada } from "@/hooks/usePorteria";
import { ESTADO_CITA, ESTADO_TURNO } from "@/lib/status";
import { formatIsoHour } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface DriverPassModalProps {
  /** Radicado, placa o cédula a consultar. `null` cierra el modal. */
  codigo: string | null;
  onClose: () => void;
}

const PASOS = [
  { label: "Cita programada", sub: "Horario confirmado en sistema" },
  { label: "En garita / inspección", sub: "Validación de EPP y documentos" },
  { label: "En espera en patio", sub: "Aguardando asignación de muelle" },
  { label: "Llamado a muelle", sub: "Acercarse a la bahía de descargue" },
  { label: "Descargando mercancía", sub: "Recepción y conteo por WMS" },
  { label: "Salida autorizada", sub: "Descargue conforme y remisión lista" },
];

/** Pase digital móvil del conductor: QR, turno de patio, llamado a bahía y firma de conformidad. */
export function DriverPassModal({ codigo, onClose }: DriverPassModalProps) {
  const { usuario } = useAuth();
  const [input, setInput] = useState(codigo ?? "");
  const [query, setQuery] = useState<string | null>(codigo);
  const [firmado, setFirmado] = useState(false);

  useEffect(() => {
    setInput(codigo ?? "");
    setQuery(codigo);
    setFirmado(false);
  }, [codigo]);

  const { data: session, isFetching, isError } = useDriverSession(codigo ? query : null);
  const registrarLlegada = useRegistrarLlegada();

  const cita = session?.cita;
  const turno = session?.turnoPatio;
  const estado = turno?.estado;

  const pasoActual = (() => {
    if (estado === "SALIDA_REGISTRADA" || cita?.estado === "COMPLETADA") return 5;
    if (estado === "DESCARGADO_LISTO_SALIDA") return 5;
    if (estado === "DESCARGANDO" || estado === "EN_MUELLE") return 4;
    if (estado === "LLAMADO_A_MUELLE") return 3;
    if (estado === "EN_PATIO_ESPERA") return 2;
    if (estado === "EN_INSPECCION_GARITA" || cita?.estado === "EN_PORTERIA") return 1;
    return 0;
  })();
  const completado = estado === "SALIDA_REGISTRADA" || cita?.estado === "COMPLETADA";

  const consultar = () => {
    const q = input.trim();
    if (!q) return;
    setFirmado(false);
    setQuery(q);
  };

  const notificarLlegada = () => {
    if (!cita) return;
    registrarLlegada.mutate(
      { citaId: cita.id, guardaId: usuario?.id ?? "driver-self", guardaNombre: "Auto check-in móvil del conductor" },
      { onSuccess: () => toast.success("Aviso de llegada enviado a garita. Puede formarse en la línea de ingreso.") }
    );
  };

  return (
    <Modal
      open={Boolean(codigo)}
      onClose={onClose}
      size="md"
      title="Portal del conductor"
      description="Pase de acceso digital con estado del flujo en tiempo real."
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 text-[12px]" style={{ color: "var(--sect-sub)" }}>
            <Phone size={13} /> Central garita: ext. 104
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            consultar();
          }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Radicado, placa o cédula…" aria-label="Consultar pase" />
          <Button type="submit" variant="secondary" leftIcon={<Search size={14} />} loading={isFetching}>
            Consultar
          </Button>
        </form>

        {isFetching && !session ? (
          <PageLoader label="Cargando pase digital del transportista…" />
        ) : !session || isError ? (
          <EmptyState icon={QrCode} title="Sin pase para la consulta" description="Verifica el radicado, la placa o la cédula del conductor." />
        ) : (
          <>
            {/* Tarjeta del pase */}
            <div
              className="relative overflow-hidden rounded-xl border p-4"
              style={{ background: "var(--code-bg)", borderColor: "var(--code-border)", color: "var(--code-text)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--code-accent)" }}>
                    Pase de acceso digital
                  </span>
                  <h3 className="mt-0.5 text-[18px] font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                    {session.cita.codigoCita}
                  </h3>
                  <p className="truncate text-[12px]" style={{ color: "var(--code-muted)" }}>
                    {session.conductor.nombres} {session.conductor.apellidos} · {session.sede?.nombre ?? "Sede"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge size="sm" tone={ESTADO_CITA[session.cita.estado].tone}>
                      {ESTADO_CITA[session.cita.estado].label}
                    </Badge>
                    {turno && (
                      <Badge size="sm" tone={ESTADO_TURNO[turno.estado].tone}>
                        {ESTADO_TURNO[turno.estado].label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="shrink-0 rounded-lg bg-white p-2 shadow-md" aria-hidden="true">
                  <QrCode size={52} className="text-slate-900" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <InfoTile label="Placa" value={session.vehiculo.placa} mono />
              <InfoTile label="Turno" value={turno?.codigoTurno ?? "Pendiente"} mono />
              <InfoTile label="Bahía" value={session.muelle?.codigoMuelle ?? "Por asignar"} mono />
            </div>
            <p className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
              Ventana programada: {formatIsoHour(session.cita.tiempos.horaProgramadaInicio)} – {formatIsoHour(session.cita.tiempos.horaProgramadaFin)} ·{" "}
              {session.cita.fechaCita}
            </p>

            {turno?.estado === "LLAMADO_A_MUELLE" && (
              <div className="space-y-2 rounded-xl p-4 text-white" style={{ background: "var(--solid-green)" }}>
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  <BellRing size={18} className="animate-bounce" /> ¡Es su turno! Acérquese al muelle
                </p>
                <p className="text-[12.5px] opacity-90">
                  Diríjase de inmediato a <strong>{turno.muelleAsignadoNombre}</strong>.
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => toast.success("Confirmado. Diríjase a la bahía asignada a máximo 10 km/h.")}
                >
                  Confirmar que voy en camino
                </Button>
              </div>
            )}

            {/* Stepper */}
            <div className="space-y-3 rounded-xl border p-4" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
              <SectionHeading title="Estado del flujo en tiempo real" />
              <ol className="space-y-2.5">
                {PASOS.map((paso, idx) => {
                  const hecho = completado ? true : pasoActual > idx;
                  const actual = !completado && pasoActual === idx;
                  return (
                    <li key={paso.label} className="flex items-center gap-3" aria-current={actual ? "step" : undefined}>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          actual && "animate-pulse"
                        )}
                        style={{
                          background: hecho ? "var(--solid-green)" : actual ? "var(--solid-amber)" : "var(--chip-count-bg)",
                          color: hecho || actual ? "#fff" : "var(--chip-count-text)",
                        }}
                      >
                        {hecho ? "✓" : idx + 1}
                      </span>
                      <span className="text-[12px]">
                        <span
                          className="block font-semibold"
                          style={{ color: actual ? "var(--tone-amber-color)" : hecho ? "var(--list-text)" : "var(--list-text-sub)" }}
                        >
                          {paso.label}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
                          {paso.sub}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {session.cita.estado === "CONFIRMADA" && (
              <Button className="w-full" leftIcon={<Navigation size={15} />} loading={registrarLlegada.isPending} onClick={notificarLlegada}>
                Notificar llegada al CD (cola de garita)
              </Button>
            )}

            <div className="space-y-2 rounded-xl border p-4 text-[12px]" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
              <SectionHeading icon={<ShieldCheck size={13} />} title="Normas obligatorias en planta" />
              <ul className="list-disc space-y-1 pl-4" style={{ color: "var(--sect-sub)" }}>
                <li>Uso continuo de botas de seguridad y chaleco reflectivo.</li>
                <li>
                  Velocidad máxima en patio: <strong>10 km/h</strong> con luces encendidas.
                </li>
                <li>Apagar motor y acuñar llantas en bahía antes de abrir el furgón.</li>
              </ul>
            </div>

            <div className="space-y-2 rounded-xl border p-4" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
              <SectionHeading
                icon={<PenTool size={13} />}
                title="Firma de conformidad del conductor"
                actions={firmado ? <Badge size="sm" tone="green">Firmado</Badge> : undefined}
              />
              {firmado ? (
                <div className="rounded-lg border p-3 text-center" style={{ borderColor: "var(--inset-border)" }}>
                  <span className="block font-serif text-[15px] italic" style={{ color: "var(--kpi-icon-pos-color)" }}>
                    {session.conductor.nombres} {session.conductor.apellidos}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: "var(--list-text-sub)" }}>
                    Firma estampada con hash SHA-256 · {new Date().toLocaleTimeString("es-CO")}
                  </span>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setFirmado(true);
                    toast.success("Firma digital del transportista registrada con éxito.");
                  }}
                >
                  Firmar entrega digitalmente
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
