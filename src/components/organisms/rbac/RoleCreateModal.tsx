"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { rolSchema, type RolFormData } from "@/schemas/usuario.schema";
import type { Rol } from "@/types";

interface RoleCreateModalProps {
  open: boolean;
  roles: Rol[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: RolFormData) => void;
}

const EMPTY: RolFormData = { codigo: "", nombre: "", descripcion: "", cloneFromId: "" };

export function RoleCreateModal({ open, roles, saving, onClose, onSubmit }: RoleCreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RolFormData>({ resolver: zodResolver(rolSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo rol personalizado"
      description="Define el rol y, opcionalmente, clona los permisos de un rol existente."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="role-form" loading={saving}>
            Crear rol
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Código único" htmlFor="rol-codigo" required error={errors.codigo?.message} hint="Ej. DESPACHADOR_EXTERNO">
          <Input
            id="rol-codigo"
            invalid={!!errors.codigo}
            style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
            {...register("codigo", { setValueAs: (v: string) => v.toUpperCase().replace(/\s+/g, "_") })}
          />
        </Field>
        <Field label="Nombre descriptivo" htmlFor="rol-nombre" required error={errors.nombre?.message}>
          <Input id="rol-nombre" invalid={!!errors.nombre} {...register("nombre")} />
        </Field>
        <Field label="Descripción operativa" htmlFor="rol-desc" error={errors.descripcion?.message}>
          <Textarea id="rol-desc" rows={3} {...register("descripcion")} />
        </Field>
        <Field label="Clonar permisos de" htmlFor="rol-clone">
          <Select id="rol-clone" {...register("cloneFromId")}>
            <option value="">Iniciar con permisos vacíos</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.permisosIds.length} permisos)
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
