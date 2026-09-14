"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Switch } from "@/components/atoms/Switch";
import { muelleSchema, type MuelleFormData } from "@/schemas/sede.schema";
import { TIPO_MUELLE } from "@/lib/status";
import { MATERIALES_OPCIONES } from "./constants";
import type { Muelle, TipoMuelle } from "@/types";

interface DockEditorModalProps {
  open: boolean;
  muelle: Muelle | null;
  sedeNombre?: string;
  siguienteNumero: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Muelle>) => void;
}

export function DockEditorModal({ open, muelle, sedeNombre, siguienteNumero, saving, onClose, onSubmit }: DockEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MuelleFormData>({ resolver: zodResolver(muelleSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      muelle
        ? {
            codigoMuelle: muelle.codigoMuelle,
            nombre: muelle.nombre,
            tipo: muelle.tipo,
            materialesPermitidos: muelle.materialesPermitidos,
            alturaMaximaMetros: muelle.alturaMaximaMetros ?? 4.5,
            pesoMaximoToneladas: muelle.pesoMaximoToneladas ?? 35,
            tiempoMaximoOperacionMinutos: muelle.tiempoMaximoOperacionMinutos,
            tiempoBufferEntreCitasMinutos: muelle.tiempoBufferEntreCitasMinutos,
            tieneRampaNiveladora: muelle.tieneRampaNiveladora,
            observaciones: muelle.observaciones ?? "",
          }
        : {
            codigoMuelle: `M-${String(siguienteNumero).padStart(2, "0")}`,
            nombre: `Muelle ${siguienteNumero}`,
            tipo: "RECEPCION",
            materialesPermitidos: ["SECOS"],
            alturaMaximaMetros: 4.5,
            pesoMaximoToneladas: 35,
            tiempoMaximoOperacionMinutos: 90,
            tiempoBufferEntreCitasMinutos: 15,
            tieneRampaNiveladora: true,
            observaciones: "",
          }
    );
  }, [open, muelle, siguienteNumero, reset]);

  const materiales = watch("materialesPermitidos") ?? [];
  const rampa = watch("tieneRampaNiveladora");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={muelle ? `Editar muelle ${muelle.codigoMuelle}` : "Nuevo muelle"}
      description={sedeNombre ? `Asignado a ${sedeNombre}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="dock-form" loading={saving}>
            Guardar muelle
          </Button>
        </>
      }
    >
      <form id="dock-form" onSubmit={handleSubmit((d) => onSubmit(d))} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" htmlFor="dock-codigo" required error={errors.codigoMuelle?.message}>
            <Input
              id="dock-codigo"
              invalid={!!errors.codigoMuelle}
              style={{ fontFamily: "var(--font-mono)" }}
              {...register("codigoMuelle", { setValueAs: (v: string) => v.toUpperCase() })}
            />
          </Field>
          <Field label="Tipo de muelle" htmlFor="dock-tipo" required>
            <Select id="dock-tipo" {...register("tipo")}>
              {(Object.keys(TIPO_MUELLE) as TipoMuelle[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_MUELLE[t].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre descriptivo" htmlFor="dock-nombre" required error={errors.nombre?.message} className="sm:col-span-2">
            <Input id="dock-nombre" invalid={!!errors.nombre} {...register("nombre")} />
          </Field>
        </div>

        <Field label="Materiales permitidos" required error={errors.materialesPermitidos?.message}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MATERIALES_OPCIONES.map((mat) => {
              const checked = materiales.includes(mat.id);
              return (
                <div
                  key={mat.id}
                  className="rounded-lg border px-3 py-2.5"
                  style={{
                    background: checked ? "var(--chip-bg-active)" : "var(--inset-bg)",
                    borderColor: checked ? "var(--chip-border-active)" : "var(--inset-border)",
                  }}
                >
                  <Checkbox
                    id={`dock-mat-${mat.id}`}
                    label={mat.label}
                    checked={checked}
                    onChange={(e) =>
                      setValue(
                        "materialesPermitidos",
                        e.target.checked ? [...materiales, mat.id] : materiales.filter((m) => m !== mat.id),
                        { shouldValidate: true }
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Altura máx. (m)" htmlFor="dock-alt" error={errors.alturaMaximaMetros?.message}>
            <Input id="dock-alt" type="number" step="0.1" {...register("alturaMaximaMetros", { valueAsNumber: true })} />
          </Field>
          <Field label="Peso máx. (t)" htmlFor="dock-peso" error={errors.pesoMaximoToneladas?.message}>
            <Input id="dock-peso" type="number" step="1" {...register("pesoMaximoToneladas", { valueAsNumber: true })} />
          </Field>
          <Field label="Operación (min)" htmlFor="dock-op" error={errors.tiempoMaximoOperacionMinutos?.message}>
            <Input id="dock-op" type="number" {...register("tiempoMaximoOperacionMinutos", { valueAsNumber: true })} />
          </Field>
          <Field label="Buffer (min)" htmlFor="dock-buffer" error={errors.tiempoBufferEntreCitasMinutos?.message}>
            <Input id="dock-buffer" type="number" {...register("tiempoBufferEntreCitasMinutos", { valueAsNumber: true })} />
          </Field>
        </div>

        <Switch
          id="dock-rampa"
          label="Rampa niveladora hidráulica"
          description="Para estibadores y montacargas."
          checked={rampa}
          onChange={(v) => setValue("tieneRampaNiveladora", v)}
        />

        <Field label="Observaciones operativas" htmlFor="dock-obs" error={errors.observaciones?.message}>
          <Input id="dock-obs" placeholder="Toma eléctrica para termoking, cortina de aire…" {...register("observaciones")} />
        </Field>
      </form>
    </Modal>
  );
}
