"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Lock, Mail, Package, Plus, QrCode, Sparkles, Trash2, X } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Badge } from "@/components/atoms/Badge";
import { Alert } from "@/components/atoms/Alert";
import { IconButton } from "@/components/atoms/IconButton";
import { Spinner } from "@/components/atoms/Spinner";
import { useBuscarSlots, useProgramarCita, useReservaTemporal } from "@/hooks/useCitas";
import { citaWizardSchema, PASO_1_FIELDS, PASO_3_FIELDS, type CitaWizardData } from "@/schemas/cita.schema";
import { todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Cita, CitaDetalleItem, Material, Proveedor, ReservaTemporal, Sede, SlotDisponible, TipoMaterial } from "@/types";

interface AppointmentWizardModalProps {
  open: boolean;
  sedes: Sede[];
  proveedores: Proveedor[];
  tiposMaterial: TipoMaterial[];
  materiales: Material[];
  initialSedeId: string;
  initialFecha: string;
  initialSlot?: { muelleId: string; horaInicio: string };
  lockedProveedorId?: string;
  onClose: () => void;
  onCreated: (cita: Cita) => void;
}

const STEPS = ["Carga y parámetros", "Slot y bahía", "Solicitud de información", "Radicado"];

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Motor de agendamiento en 4 pasos con reserva temporal de slot (10 min). */
export function AppointmentWizardModal({
  open,
  sedes,
  proveedores,
  tiposMaterial,
  materiales,
  initialSedeId,
  initialFecha,
  initialSlot,
  lockedProveedorId,
  onClose,
  onCreated,
}: AppointmentWizardModalProps) {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slot, setSlot] = useState<SlotDisponible | null>(null);
  const [reserva, setReserva] = useState<ReservaTemporal | null>(null);
  const [lockLeft, setLockLeft] = useState(600);
  const [created, setCreated] = useState<Cita | null>(null);
  const [correoInput, setCorreoInput] = useState("");

  const buscarSlots = useBuscarSlots();
  const reservar = useReservaTemporal();
  const programar = useProgramarCita();

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CitaWizardData>({ resolver: zodResolver(citaWizardSchema) });
  const items = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSlots([]);
    setSlot(null);
    setReserva(null);
    setCreated(null);
    reset({
      sedeId: initialSedeId || sedes[0]?.id || "",
      proveedorId: lockedProveedorId ?? proveedores[0]?.id ?? "",
      tipoOperacion: "RECEPCION_PROVEEDOR",
      tipoMaterialId: tiposMaterial[1]?.id ?? tiposMaterial[0]?.id ?? "",
      fechaCita: initialFecha && initialFecha !== "TODAS" ? initialFecha : todayIso(),
      correosSolicitud: proveedores.find((p) => p.id === (lockedProveedorId ?? proveedores[0]?.id))?.emailContacto ? [proveedores.find((p) => p.id === (lockedProveedorId ?? proveedores[0]?.id))?.emailContacto ?? ""] : [],
      items: [{ materialId: materiales.filter((material) => material.activo)[0]?.id ?? "", cantidadEstibas: 12, cantidadUnidades: 1200, ordenCompraNumero: "OC-SAP-98100" }],
      vehiculoPlaca: "WZM-481",
      tipoVehiculo: "TRACTOMULA",
      placaRemolque: "R-99014",
      empresaTransportadora: "Transportes Refrigerados del Norte S.A.",
      conductorNombre: "Jairo Antonio Ramírez Gómez",
      conductorCedula: "1018445902",
      conductorTelefono: "+57 314 887 1120",
      conductorArl: "SURA ARL",
      conductorEps: "Sanitas EPS",
      observaciones: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const agregarCorreos = (valor: string) => {
    const nuevos = valor
      .split(/[,;\s]+/)
      .map((correo) => correo.trim().toLowerCase())
      .filter(Boolean);
    if (!nuevos.length) return;
    const actuales = getValues("correosSolicitud") ?? [];
    setValue("correosSolicitud", Array.from(new Set([...actuales, ...nuevos])), { shouldValidate: true });
    setCorreoInput("");
  };

  const quitarCorreo = (correo: string) => {
    setValue("correosSolicitud", (getValues("correosSolicitud") ?? []).filter((item) => item !== correo), { shouldValidate: true });
  };

  useEffect(() => {
    if (!reserva) return;
    const interval = setInterval(() => {
      setLockLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setReserva(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reserva]);

  const watchedItems = watch("items") ?? [];
  const materialesHabilitados = materiales.filter((material) => material.activo);
  const tipoMaterial = tiposMaterial.find((t) => t.id === watch("tipoMaterialId"));
  const requiereFrio = Boolean(tipoMaterial?.requiereRefrigeracion);
  const totalEstibas = watchedItems.reduce((acc, it) => acc + (Number(it.cantidadEstibas) || 0), 0);
  const totalUnidades = watchedItems.reduce((acc, it) => acc + (Number(it.cantidadUnidades) || 0), 0);
  const pesoItem = (it: { materialId: string; cantidadEstibas: number }) =>
    (Number(it.cantidadEstibas) || 0) * (materialesHabilitados.find((m) => m.id === it.materialId)?.pesoPromedioKg ?? 850);
  const pesoTotal = watchedItems.reduce((acc, it) => acc + pesoItem(it), 0);
  const duracion = Math.max(30, Math.ceil(15 + totalEstibas * (tipoMaterial?.minutosDescarguePorEstiba ?? 5)));

  const goToSlots = async () => {
    if (!(await trigger([...PASO_1_FIELDS]))) return;
    const v = getValues();
    buscarSlots.mutate(
      {
        sedeId: v.sedeId,
        fecha: v.fechaCita,
        tipoOperacion: v.tipoOperacion,
        tipoMaterialId: v.tipoMaterialId,
        cantidadEstibas: totalEstibas,
        cantidadCajas: totalUnidades,
        pesoTotalKg: pesoTotal,
        requiereRefrigeracion: requiereFrio,
        duracionSolicitadaMinutos: duracion,
      },
      {
        onSuccess: (result) => {
          setSlots(result);
          const preferred =
            (initialSlot && result.find((s) => s.muelleId === initialSlot.muelleId && s.horaInicio === initialSlot.horaInicio && s.disponible)) ||
            result.find((s) => s.disponible) ||
            null;
          setSlot(preferred);
          setReserva(null);
          setStep(2);
        },
      }
    );
  };

  const lockSlot = (s: SlotDisponible) => {
    const v = getValues();
    setSlot(s);
    reservar.mutate(
      { sedeId: v.sedeId, muelleId: s.muelleId, proveedorId: v.proveedorId, fecha: v.fechaCita, horaInicio: s.horaInicio, duracionMinutos: s.duracionMinutos },
      {
        onSuccess: (r) => {
          setReserva(r);
          setLockLeft(600);
        },
      }
    );
  };

  const confirm = async () => {
    if (!(await trigger([...PASO_3_FIELDS]))) return;
    handleSubmit((data) => {
      if (!slot) return;
      toast.info(`Solicitud de información enviada a ${data.correosSolicitud.join(", ")}.`);
      const citaItems: CitaDetalleItem[] = data.items.map((it, i) => {
        const material = materialesHabilitados.find((m) => m.id === it.materialId);
        return {
          id: `item-${Date.now()}-${i}`,
          citaId: "",
          materialId: it.materialId,
          sku: material?.sku ?? "SKU",
          descripcion: material?.descripcion ?? "Material",
          cantidadUnidades: it.cantidadUnidades,
          cantidadEstibas: it.cantidadEstibas,
          pesoTotalKg: pesoItem(it),
          ordenCompraNumero: it.ordenCompraNumero,
        };
      });
      programar.mutate(
        {
          reservaId: reserva?.id,
          cita: {
            sedeId: data.sedeId,
            muelleId: slot.muelleId,
            proveedorId: data.proveedorId,
            tipoOperacion: data.tipoOperacion,
            estado: "CONFIRMADA",
            fechaCita: data.fechaCita,
            tiempos: {
              horaProgramadaInicio: `${data.fechaCita}T${slot.horaInicio}:00Z`,
              horaProgramadaFin: `${data.fechaCita}T${slot.horaFin}:00Z`,
              duracionEstimadaMinutos: slot.duracionMinutos,
            },
            items: citaItems,
            totalEstibas,
            totalCajas: totalUnidades,
            pesoTotalKg: pesoTotal,
            observacionesOperativas: data.observaciones || undefined,
          },
          transporte: {
            placa: data.vehiculoPlaca,
            tipoVehiculo: data.tipoVehiculo,
            placaRemolque: data.placaRemolque,
            empresaTransportadora: data.empresaTransportadora,
            esRefrigerado: requiereFrio,
            conductorNombre: data.conductorNombre,
            conductorCedula: data.conductorCedula,
            conductorTelefono: data.conductorTelefono,
            conductorArl: data.conductorArl,
            conductorEps: data.conductorEps,
          },
        },
        {
          onSuccess: (cita) => {
            setCreated(cita);
            setStep(4);
            onCreated(cita);
          },
        }
      );
    })();
  };

  const footer =
    step === 4 ? (
      <Button onClick={onClose}>Finalizar y ver en el tablero</Button>
    ) : (
      <>
        {step > 1 && (
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(step - 1)} className="mr-auto">
            Anterior
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        {step === 1 && (
          <Button onClick={goToSlots} loading={buscarSlots.isPending}>
            Buscar slots disponibles <ArrowRight size={14} />
          </Button>
        )}
        {step === 2 && (
          <Button onClick={() => setStep(3)} disabled={!slot}>
            Solicitar información <ArrowRight size={14} />
          </Button>
        )}
        {step === 3 && (
          <Button leftIcon={<CheckCircle2 size={14} />} onClick={confirm} loading={programar.isPending}>
            Enviar correo y radicar cita
          </Button>
        )}
      </>
    );

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Agendamiento y reserva de turno" description={`Paso ${step} de 4 · ${STEPS[step - 1]}`} footer={footer}>
      <ol className="mb-5 grid grid-cols-4 gap-2" aria-label="Progreso del agendamiento">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: done ? "var(--solid-green)" : current ? "var(--atom-navy-700)" : "var(--chip-count-bg)",
                  color: done || current ? "#fff" : "var(--list-text-sub)",
                }}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check size={12} /> : n}
              </span>
              <span className="hidden truncate text-[12px] font-medium sm:inline" style={{ color: current ? "var(--sect-title)" : "var(--list-text-sub)" }}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Sede" htmlFor="wz-sede" required error={errors.sedeId?.message}>
                <Select id="wz-sede" {...register("sedeId")}>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.ciudad})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Proveedor" htmlFor="wz-prov" required error={errors.proveedorId?.message}>
                <Select id="wz-prov" disabled={Boolean(lockedProveedorId)} {...register("proveedorId")}>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombreComercial} ({p.nitORut})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo de operación" htmlFor="wz-op" required>
                <Select id="wz-op" {...register("tipoOperacion")}>
                  <option value="RECEPCION_PROVEEDOR">Recepción de proveedor</option>
                  <option value="DEVOLUCION">Devolución</option>
                  <option value="TRANSFERENCIA_INTERNA">Transferencia entre CDs</option>
                </Select>
              </Field>
              <Field label="Tipo de material principal" htmlFor="wz-tmat" required error={errors.tipoMaterialId?.message} className="sm:col-span-2">
                <Select id="wz-tmat" {...register("tipoMaterialId")}>
                  {tiposMaterial.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.requiereRefrigeracion ? "· frío" : "· seco"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha deseada" htmlFor="wz-fecha" required error={errors.fechaCita?.message}>
                <Input id="wz-fecha" type="date" min={todayIso()} {...register("fechaCita")} />
              </Field>
            </div>

            <div>
              <SectionHeading
                icon={<Package size={13} />}
                title="Manifiesto de carga"
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={13} />}
                    onClick={() => items.append({ materialId: materialesHabilitados[0]?.id ?? "", cantidadEstibas: 2, cantidadUnidades: 200, ordenCompraNumero: "OC-SAP-98100" })}
                  >
                    Agregar SKU
                  </Button>
                }
                className="mb-3"
              />
              {errors.items?.message && (
                <p role="alert" className="mb-2 text-[11.5px]" style={{ color: "var(--atom-coral-500)" }}>
                  {errors.items.message}
                </p>
              )}
              <ul className="space-y-2">
                {items.fields.map((f, i) => (
                  <li key={f.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
                    <Field label="Material" htmlFor={`it-mat-${i}`} error={errors.items?.[i]?.materialId?.message} className="sm:col-span-5">
                      <Select id={`it-mat-${i}`} {...register(`items.${i}.materialId`)}>
                        {materialesHabilitados.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.sku} — {m.descripcion}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Estibas" htmlFor={`it-est-${i}`} error={errors.items?.[i]?.cantidadEstibas?.message} className="sm:col-span-2">
                      <Input id={`it-est-${i}`} type="number" min={1} max={36} {...register(`items.${i}.cantidadEstibas`, { valueAsNumber: true })} />
                    </Field>
                    <Field label="Unidades" htmlFor={`it-und-${i}`} error={errors.items?.[i]?.cantidadUnidades?.message} className="sm:col-span-2">
                      <Input id={`it-und-${i}`} type="number" min={1} {...register(`items.${i}.cantidadUnidades`, { valueAsNumber: true })} />
                    </Field>
                    <Field label="Orden de compra" htmlFor={`it-oc-${i}`} error={errors.items?.[i]?.ordenCompraNumero?.message} className="sm:col-span-2">
                      <Input id={`it-oc-${i}`} style={{ fontFamily: "var(--font-mono)" }} {...register(`items.${i}.ordenCompraNumero`)} />
                    </Field>
                    <div className="flex justify-end sm:col-span-1">
                      <IconButton label={`Quitar SKU ${i + 1}`} disabled={items.fields.length <= 1} onClick={() => items.remove(i)} className="disabled:opacity-30">
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Alert variant="info" title={`Duración estimada del slot: ${duracion} minutos`}>
              {totalEstibas} estibas · {totalUnidades} unidades · {(pesoTotal / 1000).toFixed(1)} t ·{" "}
              {requiereFrio ? "requiere muelle refrigerado" : "muelle de carga seca"}
            </Alert>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {reserva && (
              <Alert variant="success" title={`Slot bloqueado temporalmente · ${reserva.tokenReserva}`}>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {reserva.horaInicio} – {reserva.horaFin} ({reserva.duracionCalculadaMinutos} min) · garantizado contra sobrecupo
                  </span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>
                    <Lock size={12} className="mr-1 inline" />
                    {mmss(lockLeft)}
                  </strong>
                </span>
              </Alert>
            )}
            <SectionHeading
              icon={<Sparkles size={13} />}
              title={`Bahías y franjas disponibles (${slots.length})`}
              actions={
                <Button variant="ghost" size="sm" onClick={goToSlots} loading={buscarSlots.isPending}>
                  Recalcular
                </Button>
              }
            />
            {buscarSlots.isPending ? (
              <div className="flex justify-center py-12" style={{ color: "var(--sect-sub)" }}>
                <Spinner size={20} />
              </div>
            ) : slots.length === 0 ? (
              <EmptyState title="Sin slots para los parámetros" description="Prueba otra fecha o sede." />
            ) : (
              <ul className="scrollbar-thin grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {slots.map((s) => {
                  const selected = slot?.muelleId === s.muelleId && slot?.horaInicio === s.horaInicio;
                  return (
                    <li key={`${s.muelleId}-${s.horaInicio}`}>
                      <button
                        type="button"
                        disabled={!s.disponible || reservar.isPending}
                        onClick={() => lockSlot(s)}
                        aria-pressed={selected}
                        className={cn("flex h-full w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors", !s.disponible && "cursor-not-allowed opacity-50")}
                        style={{
                          background: selected ? "var(--chip-bg-active)" : "var(--inset-bg)",
                          borderColor: selected ? "var(--chip-border-active)" : "var(--inset-border)",
                        }}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-semibold" style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}>
                            {s.horaInicio} – {s.horaFin}
                          </span>
                          <Badge size="sm" tone={s.scoreIdoneidad > 90 ? "green" : s.scoreIdoneidad > 50 ? "blue" : "amber"}>
                            Match {s.scoreIdoneidad}%
                          </Badge>
                        </span>
                        <span className="flex items-center justify-between gap-2 text-[12px]">
                          <span className="truncate font-medium" style={{ color: "var(--list-text)" }}>
                            {s.muelleNombre}
                          </span>
                          <span style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>{s.muelleCodigo}</span>
                        </span>
                        <span className="text-[11.5px]" style={{ color: "var(--list-text-sub)" }}>
                          {s.motivoRecomendacion}
                        </span>
                        <span className="text-[11.5px] font-medium" style={{ color: s.disponible ? "var(--atom-blue-500)" : "var(--atom-coral-500)" }}>
                          {s.disponible ? (selected ? "Slot seleccionado" : "Clic para bloquear slot") : `Ocupado por ${s.conflictoCitaCodigo}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Alert variant="info" title="La información de transporte se diligenciará por correo">
              Enviaremos al proveedor un enlace para completar los datos del vehículo, conductor y documentación requerida. La cita quedará radicada con el slot reservado.
            </Alert>
            <SectionHeading icon={<Mail size={13} />} title="Enviar solicitud al proveedor" className="mb-3" />
            <Field label="Correos de contacto" htmlFor="wz-correo-solicitud" required error={errors.correosSolicitud?.message}>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(watch("correosSolicitud") ?? []).map((correo) => (
                    <span key={correo} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px]" style={{ background: "var(--chip-bg-active)", borderColor: "var(--chip-border-active)", color: "var(--list-text)" }}>
                      {correo}
                      <button type="button" onClick={() => quitarCorreo(correo)} aria-label={`Quitar ${correo}`} className="opacity-70 hover:opacity-100">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  id="wz-correo-solicitud"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="correo@empresa.com, otro@empresa.com"
                  value={correoInput}
                  invalid={!!errors.correosSolicitud}
                  onChange={(event) => setCorreoInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "," || event.key === ";") {
                      event.preventDefault();
                      agregarCorreos(correoInput);
                    }
                  }}
                  onBlur={() => agregarCorreos(correoInput)}
                />
              </div>
            </Field>
          </div>
        )}

        {step === 4 && created && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--st-active-bg)", color: "var(--atom-green-500)" }}>
              <CheckCircle2 size={28} />
            </span>
            <div>
              <h3 className="text-[18px] font-semibold" style={{ color: "var(--sect-title)" }}>
                ¡Cita agendada y radicada!
              </h3>
              <p className="mt-1 text-[13px]" style={{ color: "var(--sect-sub)" }}>
                El turno quedó programado y se emitió el pase de acceso con código QR.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-3 rounded-xl border p-5" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-white">
                <QrCode size={78} color="#051326" />
              </div>
              <p className="text-[18px] font-bold" style={{ color: "var(--sect-title)", fontFamily: "var(--font-mono)" }}>
                {created.codigoCita}
              </p>
              <dl className="space-y-1 text-left text-[12.5px]">
                {[
                  ["Fecha y hora", `${created.fechaCita} · ${slot?.horaInicio ?? ""}`],
                  ["Muelle", slot?.muelleNombre ?? created.muelleId],
                  ["Placa", getValues("vehiculoPlaca")],
                  ["Estibas", String(totalEstibas)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt style={{ color: "var(--list-text-sub)" }}>{k}</dt>
                    <dd className="font-medium" style={{ color: "var(--list-text)" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--result-text)" }}>
              <Clock size={12} /> Duración reservada: {slot?.duracionMinutos ?? duracion} min
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}
