"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCircle2, Clock, Package, Phone, Printer, QrCode, ShieldCheck, Snowflake, Truck, User } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { InfoTile } from "@/components/molecules/InfoTile";
import { Field } from "@/components/molecules/Field";
import { DataTable } from "@/components/molecules/DataTable";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Alert } from "@/components/atoms/Alert";
import { useAuth } from "@/hooks/useAuth";
import { cancelacionSchema, type CancelacionData } from "@/schemas/cita.schema";
import { formatIsoHour, formatNumber, formatTime } from "@/lib/format";
import { ESTADO_CITA } from "@/lib/status";
import type { Cita, Conductor, EstadoCita, Muelle, Proveedor, Sede, Vehiculo } from "@/types";

interface AppointmentDetailModalProps {
  cita: Cita | null;
  sedes: Sede[];
  muelles: Muelle[];
  proveedores: Proveedor[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  changing: boolean;
  onClose: () => void;
  onChangeEstado: (estado: EstadoCita, metadata?: Record<string, unknown>) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-[12.5px] last:border-b-0" style={{ borderColor: "var(--card-divider)" }}>
      <dt style={{ color: "var(--list-text-sub)" }}>{label}</dt>
      <dd className="text-right font-medium" style={{ color: "var(--list-text)" }}>
        {children}
      </dd>
    </div>
  );
}

/** Ficha 360° de la cita: tiempos, transporte, manifiesto y ciclo de vida operativo. */
export function AppointmentDetailModal({
  cita,
  sedes,
  muelles,
  proveedores,
  vehiculos,
  conductores,
  changing,
  onClose,
  onChangeEstado,
}: AppointmentDetailModalProps) {
  const { usuario, isGlobalAdmin, isSiteAdmin, isProvider, isGateOfficer, hasPermission } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelacionData>({ resolver: zodResolver(cancelacionSchema), defaultValues: { motivo: "" } });

  useEffect(() => {
    setCancelOpen(false);
    reset({ motivo: "" });
  }, [cita?.id, reset]);

  if (!cita) return <Modal open={false} onClose={onClose} />;

  const sede = sedes.find((s) => s.id === cita.sedeId);
  const muelle = muelles.find((m) => m.id === cita.muelleId);
  const proveedor = proveedores.find((p) => p.id === cita.proveedorId);
  const vehiculo = vehiculos.find((v) => v.id === cita.vehiculoId);
  const conductor = conductores.find((c) => c.id === cita.conductorId);
  const estado = ESTADO_CITA[cita.estado];

  const esOperadorMuelle = usuario?.rolCodigo === "OPERADOR_MUELLE";
  const canApprove = isGlobalAdmin || isSiteAdmin || hasPermission("CITAS_APROBAR");
  const canRegisterEntry = isGlobalAdmin || isSiteAdmin || isGateOfficer || hasPermission("PORTERIA_REGISTRO");
  const canCallToDock = isGlobalAdmin || isSiteAdmin || isGateOfficer || hasPermission("MUELLES_HABILITAR", undefined, cita.muelleId);
  const canUnload = isGlobalAdmin || isSiteAdmin || esOperadorMuelle || hasPermission("MUELLES_HABILITAR", undefined, cita.muelleId);
  const terminal = ["COMPLETADA", "CANCELADA", "RECHAZADA", "NO_SHOW"].includes(cita.estado);
  const canCancel = !terminal && cita.estado === "CONFIRMADA" && (isProvider || isGlobalAdmin || isSiteAdmin || hasPermission("CITAS_CANCELAR"));

  const acciones: { visible: boolean; estado: EstadoCita; label: string; icon: React.ReactNode }[] = [
    { visible: cita.estado === "SOLICITADA" && canApprove, estado: "CONFIRMADA", label: "Aprobar y confirmar", icon: <CheckCircle2 size={14} /> },
    { visible: cita.estado === "CONFIRMADA" && canRegisterEntry, estado: "EN_PORTERIA", label: "Registrar entrada en portería", icon: <ShieldCheck size={14} /> },
    { visible: cita.estado === "EN_PORTERIA" && canCallToDock, estado: "EN_MUELLE", label: "Llamar e ingresar a muelle", icon: <Truck size={14} /> },
    { visible: cita.estado === "EN_MUELLE" && canUnload, estado: "DESCARGANDO", label: "Iniciar descargue", icon: <Package size={14} /> },
    { visible: cita.estado === "DESCARGANDO" && canUnload, estado: "COMPLETADA", label: "Finalizar descargue", icon: <CheckCircle2 size={14} /> },
  ];
  const esCitaEspecial = Boolean(cita.esCitaEspecial || cita.motivoCitaEspecial);
  const visibles = acciones.filter((a) => a.visible);
  const showLifecycle = visibles.length > 0 || (!terminal && canCancel);

  const onCancel = handleSubmit(({ motivo }) => onChangeEstado("CANCELADA", { motivoRechazoOCancelacion: motivo }));

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="xl"
        title={`Cita ${cita.codigoCita}`}
        description={`${proveedor?.razonSocial ?? "Proveedor"} · ${sede?.nombre ?? "Sede"}`}
        actions={
          <>
            <Badge tone={estado.tone}>{estado.label}</Badge>
            <Button variant="secondary" size="sm" leftIcon={<Printer size={13} />} onClick={() => setPassOpen(true)}>
              <span className="hidden sm:inline">Pase de ingreso</span>
            </Button>
          </>
        }
        footer={
          <>
            <span className="mr-auto text-[11px]" style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>
              {cita.id} · actualizado {formatTime(cita.actualizadoEn)}
            </span>
            <Button variant="secondary" onClick={onClose}>
              Cerrar ficha
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              label="Fecha programada"
              value={cita.fechaCita}
              hint={`${formatIsoHour(cita.tiempos.horaProgramadaInicio)} – ${formatIsoHour(cita.tiempos.horaProgramadaFin)} (${cita.tiempos.duracionEstimadaMinutos} min)`}
              mono
            />
            <InfoTile label="Muelle asignado" value={muelle?.codigoMuelle ?? "—"} hint={muelle?.nombre} mono />
            <InfoTile label="Carga total" value={`${cita.totalEstibas} estibas`} hint={`${formatNumber(cita.totalCajas)} cajas · ${(cita.pesoTotalKg / 1000).toFixed(1)} t`} />
            <InfoTile
              label="Puntualidad"
              icon={<Clock size={11} />}
              value={
                cita.tiempos.minutosRetrasoLlegada === 0
                  ? "En tiempo"
                  : cita.tiempos.minutosRetrasoLlegada
                    ? `+${cita.tiempos.minutosRetrasoLlegada} min`
                    : "Pendiente de arribo"
              }
            />
          </div>

          {esCitaEspecial && (
            <Alert variant="warning" title="Cita especial">
              {cita.motivoCitaEspecial || "Caso único aprobado por la sede para atención diferenciada."}
            </Alert>
          )}

          {showLifecycle && (
            <div className="space-y-3 rounded-xl border p-4" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
              <SectionHeading title="Ciclo de vida operativo" />
              <div className="flex flex-wrap items-center gap-2">
                {visibles.map((a) => (
                  <Button key={a.estado} size="sm" leftIcon={a.icon} loading={changing} onClick={() => onChangeEstado(a.estado)}>
                    {a.label}
                  </Button>
                ))}
                {!terminal && canCancel && !cancelOpen && (
                  <Button variant="ghost" size="sm" leftIcon={<Ban size={14} />} onClick={() => setCancelOpen(true)} className="ml-auto">
                    Cancelar cita
                  </Button>
                )}
              </div>
              {cancelOpen && (
                <form onSubmit={onCancel} noValidate className="space-y-3 border-t pt-3" style={{ borderColor: "var(--card-divider)" }}>
                  <Field label="Motivo de cancelación" htmlFor="cancel-motivo" required error={errors.motivo?.message}>
                    <Textarea id="cancel-motivo" rows={2} placeholder="Proveedor reporta avería mecánica del vehículo…" invalid={!!errors.motivo} {...register("motivo")} />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)}>
                      Volver
                    </Button>
                    <Button type="submit" variant="danger" size="sm" loading={changing}>
                      Confirmar cancelación
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {cita.motivoRechazoOCancelacion && (
            <Alert variant="error" title="Motivo de cancelación / rechazo">
              {cita.motivoRechazoOCancelacion}
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <SectionHeading icon={<Truck size={13} />} title="Vehículo asignado" className="mb-2" />
              <dl>
                <Row label="Placa">
                  <span style={{ fontFamily: "var(--font-mono)" }}>{vehiculo?.placa ?? "—"}</span>
                </Row>
                <Row label="Tipo">
                  {vehiculo?.tipoVehiculo ?? "—"}
                  {vehiculo?.tieneRemolque && ` · remolque ${vehiculo.placaRemolque ?? ""}`}
                </Row>
                <Row label="Refrigeración">
                  {vehiculo?.esRefrigerado ? (
                    <span className="inline-flex items-center gap-1" style={{ color: "var(--atom-blue-500)" }}>
                      <Snowflake size={12} /> Furgón refrigerado
                    </span>
                  ) : (
                    "Carga seca"
                  )}
                </Row>
                <Row label="Transportadora">{vehiculo?.empresaTransportadora ?? "—"}</Row>
              </dl>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <SectionHeading icon={<User size={13} />} title="Conductor y seguridad social" className="mb-2" />
              <dl>
                <Row label="Nombre">{conductor ? `${conductor.nombres} ${conductor.apellidos}` : "—"}</Row>
                <Row label="Documento">
                  <span style={{ fontFamily: "var(--font-mono)" }}>{conductor?.numeroDocumento ?? "—"}</span>
                </Row>
                <Row label="ARL / EPS">
                  {conductor ? `${conductor.arl} · ${conductor.eps}` : "—"}
                </Row>
                <Row label="Contacto">
                  <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                    <Phone size={11} /> {conductor?.telefono ?? "—"}
                  </span>
                </Row>
              </dl>
            </div>
          </div>

          <div>
            <SectionHeading
              icon={<Package size={13} />}
              title={`Manifiesto de carga (${cita.items.length})`}
              actions={
                <span className="text-[12px]" style={{ color: "var(--sect-sub)" }}>
                  Peso total {formatNumber(cita.pesoTotalKg)} kg
                </span>
              }
              className="mb-2"
            />
            <DataTable
              caption="Ítems de la cita"
              rows={cita.items}
              rowKey={(it) => it.id}
              columns={[
                { key: "sku", header: "SKU", render: (it) => <span style={{ fontFamily: "var(--font-mono)" }}>{it.sku}</span> },
                { key: "desc", header: "Descripción", render: (it) => it.descripcion },
                { key: "est", header: "Estibas", align: "right", render: (it) => it.cantidadEstibas },
                { key: "und", header: "Unidades", align: "right", hideOnMobile: true, render: (it) => formatNumber(it.cantidadUnidades) },
                { key: "peso", header: "Peso", align: "right", hideOnMobile: true, render: (it) => `${formatNumber(it.pesoTotalKg)} kg` },
                { key: "oc", header: "Orden de compra", hideOnMobile: true, render: (it) => <span style={{ fontFamily: "var(--font-mono)" }}>{it.ordenCompraNumero ?? "—"}</span> },
              ]}
            />
          </div>

          {cita.observacionesOperativas && (
            <Alert variant="info" title="Observaciones operativas">
              {cita.observacionesOperativas}
            </Alert>
          )}
        </div>
      </Modal>

      <Modal
        open={passOpen}
        onClose={() => setPassOpen(false)}
        size="sm"
        title="Pase de ingreso a portería"
        footer={
          <Button leftIcon={<Printer size={14} />} onClick={() => window.print()}>
            Imprimir comprobante
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-xl border bg-white" style={{ borderColor: "var(--card-border)" }}>
            <QrCode size={88} color="#051326" />
          </div>
          <span className="text-[18px] font-bold" style={{ color: "var(--sect-title)", fontFamily: "var(--font-mono)" }}>
            {cita.codigoCita}
          </span>
          <dl className="w-full text-left">
            <Row label="Placa">{vehiculo?.placa ?? "—"}</Row>
            <Row label="Conductor">{conductor ? `${conductor.nombres} ${conductor.apellidos}` : "—"}</Row>
            <Row label="Fecha y hora">
              {cita.fechaCita} · {formatIsoHour(cita.tiempos.horaProgramadaInicio)}
            </Row>
            <Row label="Muelle">{muelle?.codigoMuelle ?? "—"}</Row>
          </dl>
        </div>
      </Modal>
    </>
  );
}
