"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { estadoMuelleSchema, type EstadoMuelleFormData } from "@/schemas/sede.schema";
import { ESTADO_MUELLE } from "@/lib/status";
import type { EstadoMuelle, Muelle } from "@/types";

interface DockStatusModalProps {
  muelle: Muelle | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: EstadoMuelleFormData) => void;
}

const DESCRIPCION: Record<EstadoMuelle, string> = {
  DISPONIBLE: "Listo para asignación de citas",
  OCUPADO: "Vehículo en proceso de carga / descarga",
  MANTENIMIENTO: "Rampa, sensores o fallas estructurales",
  RESERVADO: "Bloqueo previo al arribo",
  INACTIVO: "Fuera de turno operativo",
};

export function DockStatusModal({ muelle, saving, onClose, onSubmit }: DockStatusModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstadoMuelleFormData>({ resolver: zodResolver(estadoMuelleSchema) });

  useEffect(() => {
    if (muelle) {
      reset({ estado: muelle.estadoActual === "MANTENIMIENTO" ? "DISPONIBLE" : "MANTENIMIENTO", motivo: "" });
    }
  }, [muelle, reset]);

  return (
    <Modal
      open={Boolean(muelle)}
      onClose={onClose}
      title={`Cambio de estado · ${muelle?.codigoMuelle ?? ""}`}
      description="El cambio queda registrado en la bitácora de disponibilidad del centro logístico."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="dock-status-form" loading={saving}>
            Confirmar cambio
          </Button>
        </>
      }
    >
      <form id="dock-status-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Nuevo estado operativo" htmlFor="dock-estado" required>
          <Select id="dock-estado" {...register("estado")}>
            {(Object.keys(ESTADO_MUELLE) as EstadoMuelle[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_MUELLE[e].label} — {DESCRIPCION[e]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Motivo o justificación" htmlFor="dock-motivo" required error={errors.motivo?.message}>
          <Textarea
            id="dock-motivo"
            rows={3}
            placeholder="Mantenimiento preventivo de rampa hidráulica, falla en esclusa térmica…"
            invalid={!!errors.motivo}
            {...register("motivo")}
          />
        </Field>
      </form>
    </Modal>
  );
}
