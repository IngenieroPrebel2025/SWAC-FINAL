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
import { integracionSchema, type IntegracionFormData } from "@/schemas/integracion.schema";
import type { IntegracionApiConfig } from "@/types";

interface IntegrationEditorModalProps {
  open: boolean;
  integracion: IntegracionApiConfig | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IntegracionApiConfig>) => void;
}

const NEW_DEFAULTS: IntegracionFormData = {
  nombreServicio: "",
  codigoIdentificador: "",
  descripcion: "",
  urlBase: "https://",
  endpoint: "/",
  metodo: "GET",
  tipoAutenticacion: "BEARER_TOKEN",
  timeoutMs: 4000,
  reintentosMaximos: 2,
  modoEjecucion: "MOCK_SYNTHETIC",
};

export function IntegrationEditorModal({ open, integracion, saving, onClose, onSubmit }: IntegrationEditorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IntegracionFormData>({ resolver: zodResolver(integracionSchema), defaultValues: NEW_DEFAULTS });

  useEffect(() => {
    if (!open) return;
    reset(
      integracion
        ? {
            nombreServicio: integracion.nombreServicio,
            codigoIdentificador: integracion.codigoIdentificador,
            descripcion: integracion.descripcion,
            urlBase: integracion.urlBase,
            endpoint: integracion.endpoint,
            metodo: integracion.metodo,
            tipoAutenticacion: integracion.tipoAutenticacion,
            timeoutMs: integracion.timeoutMs,
            reintentosMaximos: integracion.reintentosMaximos,
            modoEjecucion: integracion.modoEjecucion,
          }
        : { ...NEW_DEFAULTS, codigoIdentificador: `INT-API-${Date.now().toString().slice(-5)}` }
    );
  }, [open, integracion, reset]);

  const submit = handleSubmit((data) => {
    onSubmit(
      integracion
        ? { id: integracion.id, ...data }
        : {
            ...data,
            credenciales: {},
            cabecerasPersonalizadas: [],
            mapeosCampos: [],
            cuerpoMockRespuestaJson: '{\n  "status": "OK"\n}',
            activo: true,
          }
    );
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={integracion ? "Editar endpoint corporativo" : "Registrar endpoint corporativo"}
      description="Conector externo, autenticación y parámetros operativos del contrato de datos."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="integration-form" loading={saving}>
            Guardar integración
          </Button>
        </>
      }
    >
      <form id="integration-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del servicio" htmlFor="int-nombre" required error={errors.nombreServicio?.message} className="sm:col-span-2">
            <Input id="int-nombre" placeholder="SAP S/4HANA — Órdenes de compra" invalid={!!errors.nombreServicio} {...register("nombreServicio")} />
          </Field>
          <Field label="Código identificador" htmlFor="int-codigo" required error={errors.codigoIdentificador?.message}>
            <Input id="int-codigo" invalid={!!errors.codigoIdentificador} style={{ fontFamily: "var(--font-mono)" }} {...register("codigoIdentificador")} />
          </Field>
          <Field label="Método HTTP" htmlFor="int-metodo" required>
            <Select id="int-metodo" {...register("metodo")}>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="URL base" htmlFor="int-url" required error={errors.urlBase?.message}>
            <Input id="int-url" invalid={!!errors.urlBase} style={{ fontFamily: "var(--font-mono)" }} {...register("urlBase")} />
          </Field>
          <Field label="Endpoint" htmlFor="int-endpoint" required error={errors.endpoint?.message}>
            <Input id="int-endpoint" invalid={!!errors.endpoint} style={{ fontFamily: "var(--font-mono)" }} {...register("endpoint")} />
          </Field>
          <Field label="Autenticación" htmlFor="int-auth" required>
            <Select id="int-auth" {...register("tipoAutenticacion")}>
              <option value="NONE">Sin autenticación</option>
              <option value="API_KEY">API Key</option>
              <option value="BEARER_TOKEN">Bearer token (JWT)</option>
              <option value="OAUTH2">OAuth 2.0</option>
              <option value="BASIC_AUTH">Basic auth</option>
            </Select>
          </Field>
          <Field label="Modo de ejecución" htmlFor="int-modo" required>
            <Select id="int-modo" {...register("modoEjecucion")}>
              <option value="MOCK_SYNTHETIC">Sintético (mock)</option>
              <option value="LIVE_REMOTE">Remoto (live)</option>
            </Select>
          </Field>
          <Field label="Timeout (ms)" htmlFor="int-timeout" required error={errors.timeoutMs?.message}>
            <Input id="int-timeout" type="number" invalid={!!errors.timeoutMs} {...register("timeoutMs", { valueAsNumber: true })} />
          </Field>
          <Field label="Reintentos máximos" htmlFor="int-retries" required error={errors.reintentosMaximos?.message}>
            <Input id="int-retries" type="number" invalid={!!errors.reintentosMaximos} {...register("reintentosMaximos", { valueAsNumber: true })} />
          </Field>
          <Field label="Descripción" htmlFor="int-desc" error={errors.descripcion?.message} className="sm:col-span-2">
            <Textarea id="int-desc" rows={3} invalid={!!errors.descripcion} {...register("descripcion")} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
