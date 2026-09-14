"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Switch } from "@/components/atoms/Switch";
import { usuarioSchema, type UsuarioFormData } from "@/schemas/usuario.schema";
import type { Proveedor, Rol, Sede, Usuario } from "@/types";

interface UserEditorModalProps {
  open: boolean;
  usuario: Usuario | null;
  roles: Rol[];
  sedes: Sede[];
  proveedores: Proveedor[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Usuario>, impersonateAfter: boolean) => void;
}

const EMPTY: UsuarioFormData = {
  nombreCompleto: "",
  email: "",
  documentoIdentidad: "",
  telefono: "",
  cargo: "",
  rolId: "",
  proveedorId: "",
  sedesAsignadasIds: [],
  activo: true,
};

export function UserEditorModal({ open, usuario, roles, sedes, proveedores, saving, onClose, onSubmit }: UserEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<UsuarioFormData>({ resolver: zodResolver(usuarioSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      usuario
        ? {
            nombreCompleto: usuario.nombreCompleto,
            email: usuario.email,
            documentoIdentidad: usuario.documentoIdentidad,
            telefono: usuario.telefono ?? "",
            cargo: usuario.cargo ?? "",
            rolId: usuario.rolId,
            proveedorId: usuario.proveedorId ?? "",
            sedesAsignadasIds: usuario.sedesAsignadasIds ?? [],
            activo: usuario.activo,
          }
        : { ...EMPTY, rolId: roles[0]?.id ?? "" }
    );
  }, [open, usuario, roles, reset]);

  const rolId = watch("rolId");
  const sedesSel = watch("sedesAsignadasIds");
  const activo = watch("activo");
  const rolSeleccionado = roles.find((r) => r.id === rolId);
  const esProveedor = rolSeleccionado?.codigo === "PROVEEDOR";

  const submit = (impersonateAfter: boolean) =>
    handleSubmit((data) => {
      if (esProveedor && !data.proveedorId) {
        setError("proveedorId", { message: "Asocia la empresa proveedora homologada" });
        return;
      }
      const proveedor = proveedores.find((p) => p.id === data.proveedorId);
      onSubmit(
        {
          ...(usuario ? { id: usuario.id } : {}),
          nombreCompleto: data.nombreCompleto.trim(),
          email: data.email.trim().toLowerCase(),
          documentoIdentidad: data.documentoIdentidad,
          telefono: data.telefono || undefined,
          cargo: data.cargo || undefined,
          rolId: data.rolId,
          rolCodigo: rolSeleccionado?.codigo,
          proveedorId: esProveedor ? data.proveedorId : undefined,
          nit_proveedor: esProveedor ? proveedor?.nitORut : undefined,
          sedesAsignadasIds: data.sedesAsignadasIds,
          activo: data.activo,
        },
        impersonateAfter
      );
    })();

  const toggleSede = (sedeId: string, checked: boolean) => {
    setValue(
      "sedesAsignadasIds",
      checked ? [...sedesSel, sedeId] : sedesSel.filter((id) => id !== sedeId),
      { shouldDirty: true }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={usuario ? "Editar usuario" : "Nuevo usuario"}
      description="Datos de identificación, rol de acceso y alcance multi-sede."
      footer={
        <>
          {!usuario && (
            <Button variant="ghost" leftIcon={<LogIn size={14} />} onClick={() => submit(true)} disabled={saving} className="mr-auto">
              Crear e iniciar sesión
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => submit(false)} loading={saving}>
            {usuario ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="usr-nombre" required error={errors.nombreCompleto?.message} className="sm:col-span-2">
            <Input id="usr-nombre" placeholder="Ing. Laura Gómez" invalid={!!errors.nombreCompleto} {...register("nombreCompleto")} />
          </Field>
          <Field label="Correo corporativo" htmlFor="usr-email" required error={errors.email?.message}>
            <Input id="usr-email" type="email" invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Documento de identidad" htmlFor="usr-doc" required error={errors.documentoIdentidad?.message}>
            <Input id="usr-doc" inputMode="numeric" invalid={!!errors.documentoIdentidad} {...register("documentoIdentidad")} />
          </Field>
          <Field label="Rol de acceso" htmlFor="usr-rol" required error={errors.rolId?.message}>
            <Select id="usr-rol" invalid={!!errors.rolId} {...register("rolId")}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Teléfono" htmlFor="usr-tel" error={errors.telefono?.message}>
            <Input id="usr-tel" placeholder="+57 310 000 0000" {...register("telefono")} />
          </Field>
          <Field label="Cargo" htmlFor="usr-cargo" error={errors.cargo?.message} className={esProveedor ? "" : "sm:col-span-2"}>
            <Input id="usr-cargo" placeholder="Coordinador de operaciones" {...register("cargo")} />
          </Field>
          {esProveedor && (
            <Field label="Proveedor asociado" htmlFor="usr-prov" required error={errors.proveedorId?.message}>
              <Select id="usr-prov" invalid={!!errors.proveedorId} {...register("proveedorId")}>
                <option value="">Seleccionar proveedor…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreComercial} (NIT {p.nitORut})
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <Field label="Sedes asignadas" hint="Déjalo vacío para acceso global a todas las sedes.">
          <div className="grid gap-2 sm:grid-cols-2">
            {sedes.map((sede) => (
              <div
                key={sede.id}
                className="rounded-lg border px-3 py-2.5"
                style={{
                  background: sedesSel.includes(sede.id) ? "var(--chip-bg-active)" : "var(--inset-bg)",
                  borderColor: sedesSel.includes(sede.id) ? "var(--chip-border-active)" : "var(--inset-border)",
                }}
              >
                <Checkbox
                  id={`usr-sede-${sede.id}`}
                  label={sede.nombre}
                  checked={sedesSel.includes(sede.id)}
                  onChange={(e) => toggleSede(sede.id, e.target.checked)}
                />
              </div>
            ))}
          </div>
        </Field>

        <Switch
          id="usr-activo"
          label="Usuario activo"
          description="Los usuarios inactivos no pueden iniciar sesión."
          checked={activo}
          onChange={(v) => setValue("activo", v, { shouldDirty: true })}
        />
      </form>
    </Modal>
  );
}
