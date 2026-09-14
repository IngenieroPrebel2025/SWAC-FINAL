"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { sedeSchema, type SedeFormData } from "@/schemas/sede.schema";
import type { Sede } from "@/types";

interface SedeEditorModalProps {
  open: boolean;
  sede: Sede | null;
  siguienteNumero: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Sede>) => void;
}

export function SedeEditorModal({ open, sede, siguienteNumero, saving, onClose, onSubmit }: SedeEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SedeFormData>({ resolver: zodResolver(sedeSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      sede
        ? {
            codigo: sede.codigo,
            nombre: sede.nombre,
            direccion: sede.direccion,
            ciudad: sede.ciudad,
            departamentoOEstado: sede.departamentoOEstado,
            pais: sede.pais,
            horarioApertura: sede.horarioApertura,
            horarioCierre: sede.horarioCierre,
            tiempoSlotMinutosDefecto: sede.tiempoSlotMinutosDefecto,
            toleranciaImpuntualidadMinutos: sede.toleranciaImpuntualidadMinutos,
            capacidadSimultaneaMuelles: sede.capacidadSimultaneaMuelles,
          }
        : {
            codigo: `CD-REG-${String(siguienteNumero).padStart(2, "0")}`,
            nombre: "",
            direccion: "",
            ciudad: "Medellín",
            departamentoOEstado: "Antioquia",
            pais: "Colombia",
            horarioApertura: "06:00",
            horarioCierre: "22:00",
            tiempoSlotMinutosDefecto: 30,
            toleranciaImpuntualidadMinutos: 15,
            capacidadSimultaneaMuelles: 10,
          }
    );
  }, [open, sede, siguienteNumero, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={sede ? "Editar centro de distribución" : "Nuevo centro de distribución"}
      description="Parametrización general y reglas de programación de la sede."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="sede-form" loading={saving}>
            Guardar sede
          </Button>
        </>
      }
    >
      <form id="sede-form" onSubmit={handleSubmit((d) => onSubmit(d))} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" htmlFor="sede-codigo" required error={errors.codigo?.message}>
            <Input
              id="sede-codigo"
              invalid={!!errors.codigo}
              style={{ fontFamily: "var(--font-mono)" }}
              {...register("codigo", { setValueAs: (v: string) => v.toUpperCase() })}
            />
          </Field>
          <Field label="Nombre" htmlFor="sede-nombre" required error={errors.nombre?.message}>
            <Input id="sede-nombre" placeholder="Sede Rionegro" invalid={!!errors.nombre} {...register("nombre")} />
          </Field>
          <Field label="Dirección" htmlFor="sede-dir" error={errors.direccion?.message} className="sm:col-span-2">
            <Input id="sede-dir" {...register("direccion")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ciudad" htmlFor="sede-ciudad" required error={errors.ciudad?.message}>
            <Input id="sede-ciudad" invalid={!!errors.ciudad} {...register("ciudad")} />
          </Field>
          <Field label="Departamento" htmlFor="sede-depto" error={errors.departamentoOEstado?.message}>
            <Input id="sede-depto" {...register("departamentoOEstado")} />
          </Field>
          <Field label="País" htmlFor="sede-pais" required error={errors.pais?.message}>
            <Input id="sede-pais" invalid={!!errors.pais} {...register("pais")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Apertura" htmlFor="sede-abre" required error={errors.horarioApertura?.message}>
            <Input id="sede-abre" type="time" {...register("horarioApertura")} />
          </Field>
          <Field label="Cierre" htmlFor="sede-cierra" required error={errors.horarioCierre?.message}>
            <Input id="sede-cierra" type="time" invalid={!!errors.horarioCierre} {...register("horarioCierre")} />
          </Field>
          <Field label="Min / slot" htmlFor="sede-slot" error={errors.tiempoSlotMinutosDefecto?.message}>
            <Input id="sede-slot" type="number" {...register("tiempoSlotMinutosDefecto", { valueAsNumber: true })} />
          </Field>
          <Field label="Tolerancia" htmlFor="sede-tol" error={errors.toleranciaImpuntualidadMinutos?.message}>
            <Input id="sede-tol" type="number" {...register("toleranciaImpuntualidadMinutos", { valueAsNumber: true })} />
          </Field>
          <Field label="Muelles simult." htmlFor="sede-cap" error={errors.capacidadSimultaneaMuelles?.message}>
            <Input id="sede-cap" type="number" {...register("capacidadSimultaneaMuelles", { valueAsNumber: true })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
