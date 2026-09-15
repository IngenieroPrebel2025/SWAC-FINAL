"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Lock, Mail, Package, Plus, QrCode, Sparkles, Trash2, Upload, X } from "lucide-react";
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
  defaultSpecial?: boolean;
  onClose: () => void;
  onCreated: (cita: Cita) => void;
}

interface BulkSkuRow {
  materialId: string;
  cantidadEstibas: number;
  cantidadUnidades: number;
  ordenCompraNumero: string;
  error?: string;
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
  defaultSpecial = false,
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
  const [bulkSkuOpen, setBulkSkuOpen] = useState(false);
  const [bulkSkuText, setBulkSkuText] = useState("");
  const [bulkSkuRows, setBulkSkuRows] = useState<BulkSkuRow[]>([]);
  const bulkSkuFile = useRef<HTMLInputElement>(null);

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

  const calcularCantidadTotal = (item: { cantidadUnidades?: number; cantidadPorCaja?: number; cantidadCajasRecipientes?: number }) => {
    const unidades = Number(item.cantidadUnidades) || 0;
    const porCaja = Number(item.cantidadPorCaja) || 0;
    const cajas = Number(item.cantidadCajasRecipientes) || 0;
    if (unidades > 0) return unidades;
    if (cajas > 0 && porCaja > 0) return cajas * porCaja;
    return 0;
  };

  const calcularEstibas = (item: { cantidadUnidades?: number; cantidadPorCaja?: number; cantidadCajasRecipientes?: number }) => {
    const cantidadTotal = calcularCantidadTotal(item);
    if (cantidadTotal > 0) return Math.max(1, Math.ceil(cantidadTotal / 120));
    return 1;
  };

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
      items: [{ materialId: materiales.filter((material) => material.activo)[0]?.id ?? "", cantidadEstibas: calcularEstibas({ cantidadUnidades: 1200, cantidadPorCaja: 100, cantidadCajasRecipientes: 12 }), cantidadUnidades: 1200, cantidadCajasRecipientes: 12, cantidadPorCaja: 100, saldoBodega: 5, ordenCompraNumero: "OC-SAP-98100" }],
      esCitaEspecial: defaultSpecial,
      motivoCitaEspecial: defaultSpecial ? "Caso único solicitado por la sede para atención diferenciada." : "",
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

  const parseBulkSkus = (content: string) => {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("sku") ? lines.slice(1) : lines;
    const rows = dataLines.map((line): BulkSkuRow => {
      const [sku = "", cantidadEstibas = "", cantidadUnidades = "", ordenCompraNumero = ""] = line.split(/[;,]/).map((value) => value.trim());
      const material = materialesHabilitados.find((item) => item.sku.toLowerCase() === sku.toLowerCase());
      const estibas = Number(cantidadEstibas);
      const unidades = Number(cantidadUnidades);
      const row: BulkSkuRow = { materialId: material?.id ?? "", cantidadEstibas: estibas, cantidadUnidades: unidades, ordenCompraNumero };
      if (!material || !Number.isInteger(estibas) || estibas < 1 || estibas > 36 || !Number.isInteger(unidades) || unidades < 1 || unidades > 100000 || ordenCompraNumero.length < 3) {
        row.error = !material ? `SKU no habilitado o no encontrado: ${sku}` : "Estibas, unidades y orden de compra no son válidos.";
      }
      return row;
    });
    setBulkSkuRows(rows);
  };

  const addBulkSkus = () => {
    if (!bulkSkuRows.length || bulkSkuRows.some((row) => row.error)) {
      toast.error("Corrige las filas inválidas antes de agregarlas a la cita.");
      return;
    }
    items.append(bulkSkuRows.map(({ materialId, cantidadEstibas, cantidadUnidades, ordenCompraNumero }) => ({ materialId, cantidadEstibas, cantidadUnidades, ordenCompraNumero })));
    setBulkSkuOpen(false);
    setBulkSkuText("");
    setBulkSkuRows([]);
    toast.success(`${bulkSkuRows.length} SKU agregados al manifiesto.`);
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
  const totalEstibas = watchedItems.reduce((acc, it) => acc + calcularEstibas(it as { cantidadUnidades?: number; cantidadPorCaja?: number; cantidadCajasRecipientes?: number }), 0);
  const totalUnidades = watchedItems.reduce((acc, it) => acc + calcularCantidadTotal(it as { cantidadUnidades?: number; cantidadPorCaja?: number; cantidadCajasRecipientes?: number }), 0);
  const pesoItem = (it: { materialId: string; cantidadEstibas?: number; cantidadUnidades?: number; cantidadPorCaja?: number; cantidadCajasRecipientes?: number }) =>
    (calcularEstibas(it) || 0) * (materialesHabilitados.find((m) => m.id === it.materialId)?.pesoPromedioKg ?? 850);
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
          cantidadCajasRecipientes: it.cantidadCajasRecipientes,
          cantidadPorCaja: it.cantidadPorCaja,
          saldoBodega: it.saldoBodega,
          cantidadEstibas: calcularEstibas(it),
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
            esCitaEspecial: data.esCitaEspecial,
            motivoCitaEspecial: data.motivoCitaEspecial?.trim() || undefined,
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

            <div className="space-y-4">
              {defaultSpecial && (
                <div className="rounded-xl border p-3" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
                  <Field label="Motivo de la cita especial" htmlFor="wz-motivo-cita-especial" error={errors.motivoCitaEspecial?.message}>
                    <Textarea
                      id="wz-motivo-cita-especial"
                      rows={3}
                      placeholder="Ejemplo: ingreso de producto de emergencia con despacho priorizado por cierre de bodega y caso único de operación."
                      value={watch("motivoCitaEspecial") ?? ""}
                      invalid={!!errors.motivoCitaEspecial}
                      {...register("motivoCitaEspecial")}
                    />
                  </Field>
                </div>
              )}

              <SectionHeading
                icon={<Package size={13} />}
                title="Manifiesto de carga"
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus size={13} />}
                      onClick={() => items.append({ materialId: materialesHabilitados[0]?.id ?? "", cantidadEstibas: calcularEstibas({ cantidadUnidades: 200, cantidadPorCaja: 100, cantidadCajasRecipientes: 2 }), cantidadUnidades: 200, cantidadCajasRecipientes: 2, cantidadPorCaja: 100, saldoBodega: 3, ordenCompraNumero: "OC-SAP-98100" })}
                    >
                      Agregar SKU
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Upload size={13} />} onClick={() => setBulkSkuOpen(true)}>
                      Carga masiva
                    </Button>
                  </div>
                }
                className="mb-3"
              />
              {errors.items?.message && (
                <p role="alert" className="mb-2 text-[11.5px]" style={{ color: "var(--atom-coral-500)" }}>
                  {errors.items.message}
                </p>
              )}
              <ul className="space-y-2">
                {items.fields.map((f, i) => {
                  const itemValue = watch(`items.${i}`);
                  const estibasCalculadas = calcularEstibas(itemValue ?? {});

                  return (
                    <li key={f.id} className="rounded-lg border p-3" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
                      <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
                        <Field label="Material" htmlFor={`it-mat-${i}`} error={errors.items?.[i]?.materialId?.message} className="sm:col-span-5">
                          <Select id={`it-mat-${i}`} {...register(`items.${i}.materialId`)}>
                            {materialesHabilitados.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.sku} — {m.descripcion}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--list-text-sub)" }}>
                            Estibas
                          </label>
                          <div className="flex h-[40px] items-center rounded-lg border px-3 text-sm font-medium" style={{ background: "var(--surface-soft)", borderColor: "var(--inset-border)", color: "var(--sect-title)" }}>
                            {estibasCalculadas}
                          </div>
                        </div>

                        <Field label="Orden de compra" htmlFor={`it-oc-${i}`} error={errors.items?.[i]?.ordenCompraNumero?.message} className="sm:col-span-3">
                          <Input id={`it-oc-${i}`} style={{ fontFamily: "var(--font-mono)" }} {...register(`items.${i}.ordenCompraNumero`)} />
                        </Field>

                        <div className="flex justify-end sm:col-span-2">
                          <IconButton label={`Quitar SKU ${i + 1}`} disabled={items.fields.length <= 1} onClick={() => items.remove(i)} className="disabled:opacity-30">
                            <Trash2 size={14} />
                          </IconButton>
                        </div>

                        <Field label="Cantidad total" htmlFor={`it-total-${i}`} error={errors.items?.[i]?.cantidadUnidades?.message} className="sm:col-span-3">
                          <Input id={`it-total-${i}`} type="number" min={1} {...register(`items.${i}.cantidadUnidades`, { valueAsNumber: true })} />
                        </Field>
                        <Field label="Cajas o recipientes" htmlFor={`it-cajas-${i}`} error={errors.items?.[i]?.cantidadCajasRecipientes?.message} className="sm:col-span-3">
                          <Input id={`it-cajas-${i}`} type="number" min={1} {...register(`items.${i}.cantidadCajasRecipientes`, { valueAsNumber: true })} />
                        </Field>
                        <Field label="Cant. por caja" htmlFor={`it-por-caja-${i}`} error={errors.items?.[i]?.cantidadPorCaja?.message} className="sm:col-span-3">
                          <Input id={`it-por-caja-${i}`} type="number" min={1} {...register(`items.${i}.cantidadPorCaja`, { valueAsNumber: true })} />
                        </Field>
                        <Field label="Saldo" htmlFor={`it-saldo-${i}`} error={errors.items?.[i]?.saldoBodega?.message} className="sm:col-span-3">
                          <Input id={`it-saldo-${i}`} type="number" min={0} {...register(`items.${i}.saldoBodega`, { valueAsNumber: true })} />
                        </Field>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Alert variant="info" title={`Duración estimada del slot: ${duracion} minutos`}>
              {totalEstibas} estibas · {totalUnidades} unidades · {(pesoTotal / 1000).toFixed(1)} t ·{" "}
              {requiereFrio ? "requiere muelle refrigerado" : "muelle de carga seca"}
            </Alert>
          </div>
        )}

        <Modal
          open={bulkSkuOpen}
          onClose={() => setBulkSkuOpen(false)}
          size="xl"
          title="Carga masiva de SKU"
          description="Agrega varios materiales al manifiesto de esta cita mediante CSV."
          footer={
            <>
              <Button variant="secondary" onClick={() => setBulkSkuOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addBulkSkus} disabled={!bulkSkuRows.length || bulkSkuRows.some((row) => row.error)}>
                Agregar SKU al manifiesto
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Alert variant="info" title="Formato del archivo">
              Usa una fila por SKU con estas columnas: <span style={{ fontFamily: "var(--font-mono)" }}>sku,cantidadEstibas,cantidadUnidades,ordenCompraNumero</span>.
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                const blob = new Blob(["sku,cantidadEstibas,cantidadUnidades,ordenCompraNumero\nSKU-LACT-001,12,1200,OC-SAP-98100\n"], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "plantilla-skus-cita.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}>
                Descargar plantilla
              </Button>
              <Button variant="secondary" size="sm" onClick={() => bulkSkuFile.current?.click()}>
                Seleccionar CSV
              </Button>
              <input
                ref={bulkSkuFile}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const content = String(reader.result ?? "");
                    setBulkSkuText(content);
                    parseBulkSkus(content);
                  };
                  reader.readAsText(file);
                }}
              />
            </div>
            <textarea
              value={bulkSkuText}
              onChange={(event) => {
                setBulkSkuText(event.target.value);
                parseBulkSkus(event.target.value);
              }}
              rows={6}
              placeholder="sku,cantidadEstibas,cantidadUnidades,ordenCompraNumero\nSKU-LACT-001,12,1200,OC-SAP-98100"
              className="w-full rounded-lg border p-3 text-[12px]"
              style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)", color: "var(--list-text)", fontFamily: "var(--font-mono)" }}
            />
            {bulkSkuRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--card-border)" }}>
                <table className="w-full text-left text-[12px]">
                  <thead style={{ background: "var(--inset-bg)" }}>
                    <tr><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Estibas</th><th className="px-3 py-2">Unidades</th><th className="px-3 py-2">Estado</th></tr>
                  </thead>
                  <tbody>
                    {bulkSkuRows.map((row, index) => {
                      const material = materialesHabilitados.find((item) => item.id === row.materialId);
                      return <tr key={`${row.materialId}-${index}`} className="border-t" style={{ borderColor: "var(--card-divider)" }}><td className="px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>{material?.sku ?? "—"}</td><td className="px-3 py-2">{row.cantidadEstibas}</td><td className="px-3 py-2">{row.cantidadUnidades}</td><td className="px-3 py-2">{row.error ? <span style={{ color: "var(--atom-coral-500)" }}>{row.error}</span> : <Badge tone="green">Lista</Badge>}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>

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
