"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { CheckTile } from "@/components/molecules/CheckTile";
import { InfoTile } from "@/components/molecules/InfoTile";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRegistrarSalida } from "@/hooks/usePorteria";
import { salidaSchema, type SalidaFormData } from "@/schemas/porteria.schema";
import { toast } from "@/lib/toast";
import type { Cita, TurnoPatio } from "@/types";

interface GateCheckoutModalProps {
  turno: TurnoPatio | null;
  cita?: Cita;
  onClose: () => void;
}

/** Garita de salida: remisión, furgón vacío, estibas retornadas y dwell time. */
export function GateCheckoutModal({ turno, cita, onClose }: GateCheckoutModalProps) {
  const { usuario } = useAuth();
  const registrar = useRegistrarSalida();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalidaFormData>({ resolver: zodResolver(salidaSchema) });

  useEffect(() => {
    if (!turno) return;
    reset({
      guardaNombre: usuario?.nombreCompleto.replace(/\s*\(.*?\)\s*/g, " ").trim() ?? "Oficial de garita salida",
      remisionFirmada: true,
      furgonVacioOK: true,
      estibasRetornadas: cita?.totalEstibas ?? 12,
      novedades: "Descargue completado sin novedades ni faltantes. Salida conforme.",
    });
  }, [turno, cita, usuario, reset]);

  const values = watch();
  if (!turno) return <Modal open={false} onClose={onClose} />;

  const llegada = new Date(turno.horaLlegadaPorteria || cita?.tiempos.horaLlegadaPorteria || Date.now()).getTime();
  const dwell = Math.max(15, Math.round((Date.now() - llegada) / 60000));
  const slaOk = dwell <= 90;

  const onSubmit = handleSubmit((d) => {
    registrar.mutate(
      {
        citaId: turno.citaId,
        codigoCita: turno.codigoCita,
        sedeId: turno.sedeId,
        vehiculoPlaca: turno.vehiculoPlaca,
        conductorNombre: turno.conductorNombre,
        guardaSalidaNombre: d.guardaNombre,
        remisionFirmadaYEntregada: d.remisionFirmada,
        inspeccionFurgonVacioOK: d.furgonVacioOK,
        estibasRetornadasCount: d.estibasRetornadas,
        novedadesSalida: d.novedades,
      },
      {
        onSuccess: (salida) => {
          toast.success(`Salida registrada para ${salida.vehiculoPlaca}. Estadía total: ${salida.tiempoTotalEstadiaMinutos} min.`);
          onClose();
        },
      }
    );
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Garita de salida: check-out"
      description="Verificación de remisión, furgón inspeccionado y cálculo del tiempo de estadía."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="checkout-form" leftIcon={<LogOut size={14} />} loading={registrar.isPending}>
            Autorizar salida y cerrar cita
          </Button>
        </>
      }
    >
      <form id="checkout-form" onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Turno" value={turno.codigoTurno} hint={turno.codigoCita} mono />
          <InfoTile label="Placa" value={turno.vehiculoPlaca} mono />
          <InfoTile label="Conductor" value={turno.conductorNombre} />
          <InfoTile label="Estadía" value={`${dwell} min`} hint={slaOk ? "Dentro del SLA (≤ 90 min)" : "SLA excedido"} mono />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckTile
            label="Remisión y factura firmadas"
            description="Recibo a satisfacción entregado al conductor"
            checked={values.remisionFirmada}
            onToggle={() => setValue("remisionFirmada", !values.remisionFirmada)}
          />
          <CheckTile
            label="Furgón vacío inspeccionado"
            description="Sin mercancía retenida"
            checked={values.furgonVacioOK}
            onToggle={() => setValue("furgonVacioOK", !values.furgonVacioOK)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estibas vacías retornadas" htmlFor="out-estibas" required error={errors.estibasRetornadas?.message}>
            <Input id="out-estibas" type="number" min={0} invalid={!!errors.estibasRetornadas} {...register("estibasRetornadas", { valueAsNumber: true })} />
          </Field>
          <Field label="Oficial de salida" htmlFor="out-guarda" required error={errors.guardaNombre?.message}>
            <Input id="out-guarda" invalid={!!errors.guardaNombre} {...register("guardaNombre")} />
          </Field>
        </div>
        <Field label="Novedades de salida" htmlFor="out-nov" error={errors.novedades?.message}>
          <Textarea id="out-nov" rows={2} {...register("novedades")} />
        </Field>
      </form>
    </Modal>
  );
}
