"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronRight, RotateCcw, Save, Terminal, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Field } from "@/components/molecules/Field";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Switch } from "@/components/atoms/Switch";
import { RadioGroup } from "@/components/atoms/RadioGroup";
import { Alert } from "@/components/atoms/Alert";
import { Badge, type BadgeTone } from "@/components/atoms/Badge";
import { JsonBlock } from "@/components/atoms/JsonBlock";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { DEFAULT_SYSTEM_CONFIG, resetSystemConfig, updateSystemConfig } from "@/store/slices/systemConfigSlice";
import { clearHttpLogs } from "@/store/slices/httpLogSlice";
import { sistemaSchema, type SistemaFormData } from "@/schemas/sistema.schema";
import { formatTime } from "@/lib/format";
import { toast } from "@/lib/toast";

const METHOD_TONE: Record<string, BadgeTone> = {
  GET: "blue",
  POST: "green",
  PUT: "amber",
  PATCH: "amber",
  DELETE: "coral",
};

const toFormData = (c: typeof DEFAULT_SYSTEM_CONFIG): SistemaFormData => ({
  dataSourceMode: c.dataSourceMode,
  apiBaseUrl: c.apiBaseUrl,
  defaultTimeoutMs: c.defaultTimeoutMs,
  syntheticDelayMs: c.syntheticDelayMs,
  logHttpRequests: c.logHttpRequests,
});

export function SystemSettingsView() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((s) => s.systemConfig);
  const logs = useAppSelector((s) => s.httpLog.logs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SistemaFormData>({ resolver: zodResolver(sistemaSchema), defaultValues: toFormData(config) });

  useEffect(() => {
    reset(toFormData(config));
  }, [config, reset]);

  const mode = watch("dataSourceMode");
  const delay = watch("syntheticDelayMs");
  const logEnabled = watch("logHttpRequests");

  const onSubmit = handleSubmit((data) => {
    dispatch(updateSystemConfig(data));
    toast.success(`Configuración aplicada. Origen de datos: ${data.dataSourceMode === "MOCK" ? "demostración" : "API real"}.`);
  });

  const handleReset = () => {
    dispatch(resetSystemConfig());
    toast.info("Configuración restablecida a los valores por defecto.");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Sistema"
        description="Parametrización en tiempo de ejecución del adaptador de datos, el backend y la telemetría HTTP."
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} noValidate className="lg:col-span-2">
          <Surface className="space-y-5 p-5">
            <SectionHeading title="Adaptador de datos" description="Define de dónde obtienen información los repositorios." />

            <RadioGroup
              name="dataSourceMode"
              value={mode}
              onChange={(v) => setValue("dataSourceMode", v as SistemaFormData["dataSourceMode"], { shouldDirty: true })}
              options={[
                {
                  value: "MOCK",
                  label: "Datos de demostración (mock)",
                  description: "Repositorios en memoria con datos sintéticos y latencia simulada. No requiere backend.",
                },
                {
                  value: "LIVE_API",
                  label: "API real (HTTP)",
                  description: "Peticiones Axios con Bearer token y cabeceras multi-sede contra el backend.",
                },
              ]}
            />

            <Field label="URL base del backend" htmlFor="apiBaseUrl" required error={errors.apiBaseUrl?.message}>
              <Input id="apiBaseUrl" invalid={!!errors.apiBaseUrl} style={{ fontFamily: "var(--font-mono)" }} {...register("apiBaseUrl")} />
            </Field>

            <Field
              label={`Latencia simulada en modo demo: ${Number.isNaN(delay) ? 0 : delay} ms`}
              htmlFor="syntheticDelayMs"
              error={errors.syntheticDelayMs?.message}
              hint="0 ms instantáneo · 250 ms realista · 1500 ms alta carga"
            >
              <input
                id="syntheticDelayMs"
                type="range"
                min={0}
                max={1500}
                step={50}
                className="w-full"
                disabled={mode !== "MOCK"}
                {...register("syntheticDelayMs", { valueAsNumber: true })}
              />
            </Field>

            <Field label="Timeout de peticiones (ms)" htmlFor="defaultTimeoutMs" required error={errors.defaultTimeoutMs?.message}>
              <Input
                id="defaultTimeoutMs"
                type="number"
                min={1000}
                step={500}
                invalid={!!errors.defaultTimeoutMs}
                {...register("defaultTimeoutMs", { valueAsNumber: true })}
              />
            </Field>

            <Switch
              id="logHttpRequests"
              label="Registrar telemetría HTTP"
              description="Guarda las últimas 50 peticiones para inspección en la consola."
              checked={logEnabled}
              onChange={(v) => setValue("logHttpRequests", v, { shouldDirty: true })}
            />

            {mode === "LIVE_API" && config.dataSourceMode === "MOCK" && (
              <Alert variant="warning" title="Cambio a API real">
                Al aplicar, todas las consultas se reiniciarán contra el backend configurado. Si no está disponible verás errores de conexión.
              </Alert>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--card-divider)" }}>
              <Button type="button" variant="ghost" leftIcon={<RotateCcw size={14} />} onClick={handleReset}>
                Restablecer
              </Button>
              <Button type="submit" leftIcon={<Save size={14} />} disabled={!isDirty}>
                Guardar y aplicar
              </Button>
            </div>
          </Surface>
        </form>

        <Surface className="p-5 lg:col-span-3">
          <SectionHeading
            icon={<Terminal size={13} />}
            title={`Consola de telemetría HTTP (${logs.length})`}
            description="Peticiones emitidas por los adaptadores de repositorio."
            actions={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Trash2 size={13} />}
                disabled={logs.length === 0}
                onClick={() => dispatch(clearHttpLogs())}
              >
                Limpiar
              </Button>
            }
            className="mb-4"
          />

          {logs.length === 0 ? (
            <EmptyState
              icon={Terminal}
              title="Sin peticiones registradas"
              description="Navega por los módulos para observar el tráfico del adaptador."
            />
          ) : (
            <ul className="scrollbar-thin max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {logs.map((log) => {
                const expanded = expandedId === log.id;
                const isError = log.status === 0 || log.status >= 400 || Boolean(log.error);
                return (
                  <li
                    key={log.id}
                    className="rounded-lg border"
                    style={{
                      borderColor: isError ? "rgba(242,125,114,0.4)" : "var(--card-border)",
                      background: "var(--inset-bg)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : log.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Badge size="sm" tone={METHOD_TONE[log.method] ?? "slate"}>
                        {log.method}
                      </Badge>
                      <span
                        className="min-w-0 flex-1 truncate text-[12px]"
                        style={{ color: "var(--list-text)", fontFamily: "var(--font-mono)" }}
                        title={log.url}
                      >
                        {log.url}
                      </span>
                      <span
                        className="shrink-0 text-[12px] font-semibold"
                        style={{ color: isError ? "var(--atom-coral-500)" : "var(--atom-green-500)", fontFamily: "var(--font-mono)" }}
                      >
                        {log.status || "ERR"}
                      </span>
                      <span className="hidden shrink-0 text-[11px] sm:inline" style={{ color: "var(--list-text-sub)" }}>
                        {log.durationMs} ms
                      </span>
                      <Badge size="sm" tone={log.source === "MOCK" ? "amber" : "green"} className="hidden sm:inline-flex">
                        {log.source === "MOCK" ? "Mock" : "Live"}
                      </Badge>
                    </button>
                    {expanded && (
                      <div className="space-y-3 border-t px-3 py-3" style={{ borderColor: "var(--card-divider)" }}>
                        <p className="text-[11px]" style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}>
                          {formatTime(log.timestamp)} · {log.id}
                        </p>
                        {log.error && (
                          <Alert variant="error" title="Error">
                            {log.error}
                          </Alert>
                        )}
                        {log.requestPayload !== undefined && <JsonBlock title="Payload enviado" data={log.requestPayload} maxHeight={180} />}
                        {log.responsePayload !== undefined && <JsonBlock title="Respuesta recibida" data={log.responsePayload} maxHeight={260} />}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>
      </div>
    </PageContainer>
  );
}
