"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck, Lock, Sparkles, Thermometer, Truck, User } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { CheckTile } from "@/components/molecules/CheckTile";
import { InfoTile } from "@/components/molecules/InfoTile";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Badge } from "@/components/atoms/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useGuardarInspeccion } from "@/hooks/usePorteria";
import { CHECKLIST_PORTERIA_DEFAULT } from "@/mocks/gate.mock";
import { inspeccionSchema, type InspeccionFormData } from "@/schemas/porteria.schema";
import { toast } from "@/lib/toast";
import type { Cita, Conductor, Muelle, Proveedor, ResultadoInspeccion, Vehiculo } from "@/types";

interface GateInspectionModalProps {
  cita: Cita | null;
  muelle?: Muelle;
  proveedor?: Proveedor;
  vehiculo?: Vehiculo;
  conductor?: Conductor;
  onClose: () => void;
}

const BOOL_FIELDS = ["arlVigente", "epsVigente", "eppCompleto", "soatVigente", "tecnomecanicaVigente", "inspeccionFurgonLimpio", "libreOloresYPlagas", "precintosCoinciden"] as const;

/** Inspección física y de seguridad en portería (EPP, documentos, furgón, cadena de frío). */
export function GateInspectionModal({ cita, muelle, proveedor, vehiculo, conductor, onClose }: GateInspectionModalProps) {
  const { usuario } = useAuth();
  const guardar = useGuardarInspeccion();

  const esRefrigerado = Boolean(
    muelle?.materialesPermitidos.includes("REFRIGERADOS") ||
      cita?.items.some((it) => it.temperaturaObjetivoCelsius !== undefined && it.temperaturaObjetivoCelsius <= 4)
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InspeccionFormData>({ resolver: zodResolver(inspeccionSchema) });

  useEffect(() => {
    if (!cita) return;
    reset({
      guardaNombre: usuario?.nombreCompleto.replace(/\s*\(.*?\)\s*/g, " ").trim() ?? "Oficial de garita",
      arlVigente: true,
      epsVigente: true,
      eppCompleto: true,
      soatVigente: true,
      tecnomecanicaVigente: true,
      inspeccionFurgonLimpio: true,
      libreOloresYPlagas: true,
      precintosTexto: "SEAL-COL-884910, SEAL-COL-884911",
      precintosCoinciden: true,
      temperatura: esRefrigerado ? 3.4 : 20,
      checklist: CHECKLIST_PORTERIA_DEFAULT.map((c) => ({ id: c.id, cumple: c.cumple })),
      resultado: "APROBADO",
      motivoRechazo: "",
      observaciones: "Conductor con EPP reglamentario y precintos validados contra la remisión física.",
    });
  }, [cita, usuario, esRefrigerado, reset]);

  const values = watch();
  if (!cita) return <Modal open={false} onClose={onClose} />;

  const toggle = (field: (typeof BOOL_FIELDS)[number]) => setValue(field, !values[field], { shouldDirty: true });

  const approveAll = () => {
    BOOL_FIELDS.forEach((f) => setValue(f, true));
    setValue("checklist", (values.checklist ?? []).map((c) => ({ ...c, cumple: true })));
    setValue("resultado", "APROBADO");
    toast.info("Todos los ítems marcados como conformes.");
  };

  const onSubmit = handleSubmit((d) => {
    guardar.mutate(
      {
        citaId: cita.id,
        codigoCita: cita.codigoCita,
        sedeId: cita.sedeId,
        guardaSeguridadId: usuario?.id ?? "usr-porteria",
        guardaSeguridadNombre: d.guardaNombre,
        conductorId: conductor?.id ?? cita.conductorId ?? "",
        conductorNombre: conductor ? `${conductor.nombres} ${conductor.apellidos}` : "Conductor asignado",
        conductorCedula: conductor?.numeroDocumento ?? "",
        arlVigente: d.arlVigente,
        epsVigente: d.epsVigente,
        eppCompleto: d.eppCompleto,
        vehiculoId: vehiculo?.id ?? cita.vehiculoId ?? "",
        vehiculoPlaca: vehiculo?.placa ?? "",
        soatVigente: d.soatVigente,
        tecnomecanicaVigente: d.tecnomecanicaVigente,
        inspeccionFurgonLimpio: d.inspeccionFurgonLimpio,
        libreOloresYPlagas: d.libreOloresYPlagas,
        precintosRegistrados: d.precintosTexto.split(",").map((p) => p.trim()).filter(Boolean),
        precintosCoincidenConRemision: d.precintosCoinciden,
        temperaturaFurgonCelsius: esRefrigerado ? d.temperatura : undefined,
        temperaturaCumpleRango: esRefrigerado ? d.temperatura >= -25 && d.temperatura <= 4 : true,
        itemsChecklist: CHECKLIST_PORTERIA_DEFAULT.map((item) => ({
          ...item,
          cumple: d.checklist.find((c) => c.id === item.id)?.cumple ?? item.cumple,
        })),
        resultado: d.resultado,
        motivoRechazo: d.resultado === "RECHAZADO" ? d.motivoRechazo : undefined,
        observacionesGenerales: d.observaciones,
        fotosEvidencias: [],
      },
      {
        onSuccess: (insp) => {
          toast.success(
            insp.resultado === "RECHAZADO"
              ? "Ingreso rechazado y registrado en la bitácora de seguridad."
              : "Inspección aprobada. Vehículo habilitado para ingresar al patio."
          );
          onClose();
        },
      }
    );
  });

  const tempOk = values.temperatura <= 4 && values.temperatura >= -20;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Inspección de seguridad · ${cita.codigoCita}`}
      description="Checklist obligatorio de EPP, documentación legal, estado del furgón y cadena de frío."
      actions={
        <Button variant="secondary" size="sm" leftIcon={<Sparkles size={13} />} onClick={approveAll}>
          <span className="hidden sm:inline">Validar todo OK</span>
        </Button>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="inspection-form" loading={guardar.isPending} variant={values.resultado === "RECHAZADO" ? "danger" : "primary"}>
            {values.resultado === "RECHAZADO" ? "Registrar rechazo" : "Completar inspección y asignar patio"}
          </Button>
        </>
      }
    >
      <form id="inspection-form" onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Conductor" value={conductor ? `${conductor.nombres} ${conductor.apellidos}` : "Conductor asignado"} hint={conductor ? `CC ${conductor.numeroDocumento}` : undefined} />
          <InfoTile label="Vehículo" value={vehiculo?.placa ?? "—"} hint={vehiculo?.tipoVehiculo} mono />
          <InfoTile label="Proveedor" value={proveedor?.nombreComercial ?? "—"} hint={`${cita.totalEstibas} estibas · ${(cita.pesoTotalKg / 1000).toFixed(1)} t`} />
          <InfoTile label="Bahía" value={muelle?.codigoMuelle ?? "—"} hint={esRefrigerado ? "Cadena de frío" : "Carga seca"} mono />
        </div>

        <section className="space-y-3">
          <SectionHeading icon={<User size={13} />} title="1. Conductor y seguridad social" />
          <div className="grid gap-3 sm:grid-cols-3">
            <CheckTile label="ARL vigente" description="Planilla de aportes del mes" checked={values.arlVigente} onToggle={() => toggle("arlVigente")} />
            <CheckTile label="EPS activa" description="Certificación ADRES" checked={values.epsVigente} onToggle={() => toggle("epsVigente")} />
            <CheckTile label="EPP reglamentario" description="Botas, chaleco, casco" checked={values.eppCompleto} onToggle={() => toggle("eppCompleto")} />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading icon={<Truck size={13} />} title="2. Documentación vehicular y estado del furgón" />
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckTile label="SOAT vigente" checked={values.soatVigente} onToggle={() => toggle("soatVigente")} />
            <CheckTile label="Revisión técnico-mecánica" checked={values.tecnomecanicaVigente} onToggle={() => toggle("tecnomecanicaVigente")} />
            <CheckTile label="Furgón limpio y sanitizado" checked={values.inspeccionFurgonLimpio} onToggle={() => toggle("inspeccionFurgonLimpio")} />
            <CheckTile label="Libre de olores y plagas" checked={values.libreOloresYPlagas} onToggle={() => toggle("libreOloresYPlagas")} />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading icon={<Lock size={13} />} title="3. Precintos y cadena de frío" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="Números de precinto" htmlFor="insp-precintos" hint="Separados por coma" error={errors.precintosTexto?.message}>
                <Input id="insp-precintos" style={{ fontFamily: "var(--font-mono)" }} {...register("precintosTexto")} />
              </Field>
              <CheckTile label="Precintos coinciden con la remisión" checked={values.precintosCoinciden} onToggle={() => toggle("precintosCoinciden")} />
            </div>
            <Field
              label={esRefrigerado ? "Temperatura del termógrafo" : "Temperatura (carga seca, informativa)"}
              htmlFor="insp-temp"
              hint="−25 °C congelado · 0–4 °C refrigerado óptimo · +30 °C"
            >
              <div className="flex items-center gap-3">
                <Thermometer size={16} style={{ color: "var(--atom-blue-500)" }} />
                <input id="insp-temp" type="range" min={-25} max={30} step={0.1} className="flex-1" {...register("temperatura", { valueAsNumber: true })} />
                <Badge tone={!esRefrigerado ? "slate" : tempOk ? "green" : "coral"} style={{ fontFamily: "var(--font-mono)" }}>
                  {Number(values.temperatura ?? 0).toFixed(1)} °C
                </Badge>
              </div>
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading icon={<FileCheck size={13} />} title="4. Checklist detallado de garita" />
          <div className="grid gap-2 md:grid-cols-2">
            {CHECKLIST_PORTERIA_DEFAULT.map((item, i) => (
              <CheckTile
                key={item.id}
                label={item.nombre}
                description={item.descripcion}
                checked={values.checklist?.[i]?.cumple ?? true}
                onToggle={() => setValue(`checklist.${i}.cumple`, !values.checklist?.[i]?.cumple)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-4" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
          <SectionHeading
            title="5. Veredicto del guarda"
            actions={
              <SegmentedControl<ResultadoInspeccion>
                ariaLabel="Veredicto"
                value={values.resultado}
                onChange={(v) => setValue("resultado", v, { shouldValidate: true })}
                options={[
                  { value: "APROBADO", label: "Aprobado" },
                  { value: "APROBADO_CON_OBSERVACIONES", label: "Con observación" },
                  { value: "RECHAZADO", label: "Rechazar acceso" },
                ]}
              />
            }
          />
          {values.resultado === "RECHAZADO" && (
            <Field label="Motivo del rechazo" htmlFor="insp-motivo" required error={errors.motivoRechazo?.message}>
              <Input id="insp-motivo" placeholder="Precintos rotos / conductor sin ARL / temperatura fuera de rango" invalid={!!errors.motivoRechazo} {...register("motivoRechazo")} />
            </Field>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Observaciones generales" htmlFor="insp-obs" error={errors.observaciones?.message} className="md:col-span-2">
              <Textarea id="insp-obs" rows={2} {...register("observaciones")} />
            </Field>
            <Field label="Oficial responsable" htmlFor="insp-guarda" required error={errors.guardaNombre?.message}>
              <Input id="insp-guarda" invalid={!!errors.guardaNombre} {...register("guardaNombre")} />
            </Field>
          </div>
        </section>
      </form>
    </Modal>
  );
}
