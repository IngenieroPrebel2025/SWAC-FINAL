"use client";

import { useState } from "react";
import { ArrowRight, Pencil, Play, Plus, Share2, Shield } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { DataTable } from "@/components/molecules/DataTable";
import { EmptyState } from "@/components/molecules/EmptyState";
import { InfoTile } from "@/components/molecules/InfoTile";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge, type BadgeTone } from "@/components/atoms/Badge";
import { Alert } from "@/components/atoms/Alert";
import { JsonBlock } from "@/components/atoms/JsonBlock";
import { Spinner } from "@/components/atoms/Spinner";
import { IntegrationEditorModal } from "@/components/organisms/integrations/IntegrationEditorModal";
import { useGuardarIntegracion, useIntegraciones, useProbarConexion } from "@/hooks/useIntegraciones";
import { formatRelative } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { IntegracionApiConfig, ModoEjecucionIntegracion, ResultadoPruebaApi } from "@/types";

const METHOD_TONE: Record<string, BadgeTone> = { GET: "blue", POST: "green", PUT: "amber", PATCH: "amber", DELETE: "coral" };

const AUTH_LABEL: Record<IntegracionApiConfig["tipoAutenticacion"], string> = {
  NONE: "Sin autenticación",
  API_KEY: "API Key",
  BEARER_TOKEN: "Bearer token",
  OAUTH2: "OAuth 2.0",
  BASIC_AUTH: "Basic auth",
};

export function IntegrationsView() {
  const { data: integraciones = [], isLoading } = useIntegraciones();
  const guardar = useGuardarIntegracion();
  const probar = useProbarConexion();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("config");
  const [modoPrueba, setModoPrueba] = useState<ModoEjecucionIntegracion | null>(null);
  const [resultado, setResultado] = useState<ResultadoPruebaApi | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; integracion: IntegracionApiConfig | null }>({
    open: false,
    integracion: null,
  });

  const current = integraciones.find((i) => i.id === selectedId) ?? integraciones[0];
  const modo = modoPrueba ?? current?.modoEjecucion ?? "MOCK_SYNTHETIC";

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setResultado(null);
    setModoPrueba(null);
  };

  const handleTest = () => {
    if (!current) return;
    probar.mutate(
      { integracionId: current.id, modo },
      {
        onSuccess: (res) => {
          setResultado(res);
          setTab("consola");
          toast.success(`Prueba ${res.modoUtilizado === "MOCK_SYNTHETIC" ? "sintética" : "remota"}: HTTP ${res.status} en ${res.tiempoRespuestaMs} ms`);
        },
      }
    );
  };

  const handleSave = (data: Partial<IntegracionApiConfig>) => {
    guardar.mutate(data, {
      onSuccess: (saved) => {
        toast.success(`Integración “${saved.nombreServicio}” guardada.`);
        setEditor({ open: false, integracion: null });
        setSelectedId(saved.id);
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Integraciones y APIs"
        description="Configuración y mapeo de endpoints para sincronización con ERP, WMS y sistemas externos."
        actions={
          <Button leftIcon={<Plus size={15} />} onClick={() => setEditor({ open: true, integracion: null })}>
            Registrar endpoint
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20" style={{ color: "var(--sect-sub)" }}>
          <Spinner size={22} />
        </div>
      ) : integraciones.length === 0 ? (
        <EmptyState icon={Share2} title="Sin integraciones" description="Registra el primer endpoint corporativo." />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-12">
          <Surface className="p-4 lg:col-span-4">
            <SectionHeading title="APIs configuradas" className="mb-3" />
            <ul className="space-y-2">
              {integraciones.map((api) => {
                const active = api.id === current?.id;
                return (
                  <li key={api.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(api.id)}
                      aria-pressed={active}
                      className="w-full rounded-lg border p-3 text-left transition-colors"
                      style={{
                        background: active ? "var(--chip-bg-active)" : "transparent",
                        borderColor: active ? "var(--chip-border-active)" : "var(--card-border)",
                      }}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Badge size="sm" tone={METHOD_TONE[api.metodo]}>
                            {api.metodo}
                          </Badge>
                          <span className="truncate text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
                            {api.nombreServicio}
                          </span>
                        </span>
                        <Badge size="sm" tone={api.modoEjecucion === "MOCK_SYNTHETIC" ? "amber" : "green"}>
                          {api.modoEjecucion === "MOCK_SYNTHETIC" ? "Mock" : "Live"}
                        </Badge>
                      </div>
                      <span className="block truncate text-[11.5px]" style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}>
                        {api.endpoint}
                      </span>
                      <span className="mt-2 flex items-center justify-between text-[11px]" style={{ color: "var(--result-text)" }}>
                        <span className="flex items-center gap-1">
                          <Shield size={11} /> {AUTH_LABEL[api.tipoAutenticacion]}
                        </span>
                        <span>{api.mapeosCampos.length} campos mapeados</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Surface>

          {current && (
            <Surface className="p-5 lg:col-span-8">
              <div className="flex flex-col gap-4 border-b pb-4 xl:flex-row xl:items-start xl:justify-between" style={{ borderColor: "var(--card-divider)" }}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16px] font-semibold" style={{ color: "var(--sect-title)" }}>
                      {current.nombreServicio}
                    </h2>
                    <Badge size="sm" tone="slate">
                      {current.codigoIdentificador}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
                    {current.descripcion}
                  </p>
                  <p
                    className="mt-2 inline-flex max-w-full items-center gap-2 truncate rounded-md border px-2 py-1 text-[12px]"
                    style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)", fontFamily: "var(--font-mono)", color: "var(--list-text)" }}
                  >
                    <strong style={{ color: "var(--atom-blue-500)" }}>{current.metodo}</strong>
                    <span className="truncate">
                      {current.urlBase}
                      {current.endpoint}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <SegmentedControl<ModoEjecucionIntegracion>
                    ariaLabel="Modo de prueba"
                    value={modo}
                    onChange={setModoPrueba}
                    options={[
                      { value: "MOCK_SYNTHETIC", label: "Sintético" },
                      { value: "LIVE_REMOTE", label: "Remoto" },
                    ]}
                  />
                  <Button variant="secondary" size="sm" leftIcon={<Pencil size={13} />} onClick={() => setEditor({ open: true, integracion: current })}>
                    Editar
                  </Button>
                  <Button size="sm" leftIcon={<Play size={13} />} loading={probar.isPending} onClick={handleTest}>
                    Probar conexión
                  </Button>
                </div>
              </div>

              <Tabs
                className="my-4"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "config", label: "Configuración" },
                  { value: "mapeo", label: "Mapeo de campos", badge: current.mapeosCampos.length },
                  { value: "consola", label: "Consola de pruebas" },
                ]}
              />

              <TabsPanel value="config" activeValue={tab} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoTile label="Autenticación" value={AUTH_LABEL[current.tipoAutenticacion]} />
                  <InfoTile label="Timeout" value={`${current.timeoutMs} ms`} mono />
                  <InfoTile label="Reintentos" value={current.reintentosMaximos} mono />
                  <InfoTile label="Modo" value={current.modoEjecucion === "MOCK_SYNTHETIC" ? "Sintético" : "Remoto"} />
                </div>
                {current.fechaUltimaPrueba && (
                  <Alert variant={current.ultimaPruebaExitosa ? "success" : "warning"} title={`Última prueba · ${formatRelative(current.fechaUltimaPrueba)}`}>
                    {current.ultimoMensajePrueba}
                  </Alert>
                )}
                {current.cabecerasPersonalizadas.length > 0 && (
                  <DataTable
                    caption="Cabeceras personalizadas"
                    rows={current.cabecerasPersonalizadas}
                    rowKey={(h) => h.id}
                    columns={[
                      { key: "clave", header: "Cabecera", render: (h) => <span style={{ fontFamily: "var(--font-mono)" }}>{h.clave}</span> },
                      { key: "valor", header: "Valor", render: (h) => <span style={{ fontFamily: "var(--font-mono)" }}>{h.esSecreto ? "••••••" : h.valor}</span> },
                      {
                        key: "estado",
                        header: "Estado",
                        align: "right",
                        render: (h) => (
                          <Badge size="sm" tone={h.habilitado ? "green" : "slate"}>
                            {h.habilitado ? "Activa" : "Inactiva"}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                )}
              </TabsPanel>

              <TabsPanel value="mapeo" activeValue={tab}>
                <DataTable
                  caption="Mapeo de campos de la API al modelo SWAC"
                  rows={current.mapeosCampos}
                  rowKey={(m) => m.id}
                  emptyState={<EmptyState title="Sin mapeos" description="Esta integración aún no tiene campos mapeados." />}
                  columns={[
                    { key: "origen", header: "Campo origen (API)", render: (m) => <code style={{ color: "var(--atom-amber-500)" }}>{m.campoOrigenApi}</code> },
                    { key: "flecha", header: "", width: "40px", hideOnMobile: true, render: () => <ArrowRight size={14} style={{ color: "var(--result-text)" }} /> },
                    { key: "destino", header: "Campo destino (SWAC)", render: (m) => <code style={{ color: "var(--atom-blue-500)" }}>{m.campoDestinoSistema}</code> },
                    { key: "tipo", header: "Tipo", hideOnMobile: true, render: (m) => <Badge size="sm" tone="slate">{m.tipoDato}</Badge> },
                    {
                      key: "req",
                      header: "Requerido",
                      align: "right",
                      render: (m) => (
                        <Badge size="sm" tone={m.esRequerido ? "coral" : "slate"}>
                          {m.esRequerido ? "Obligatorio" : "Opcional"}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </TabsPanel>

              <TabsPanel value="consola" activeValue={tab}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <JsonBlock title="Respuesta sintética (plantilla mock)" data={current.cuerpoMockRespuestaJson} />
                  {resultado ? (
                    <div className="space-y-3">
                      <JsonBlock
                        title={`Entidad mapeada · HTTP ${resultado.status} · ${resultado.tiempoRespuestaMs} ms`}
                        data={resultado.cuerpoMapeado}
                      />
                      {resultado.erroresMapeo.length > 0 && (
                        <Alert variant="warning" title="Advertencias de mapeo">
                          <ul className="list-disc pl-4">
                            {resultado.erroresMapeo.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Play}
                      title="Sin resultados aún"
                      description="Presiona “Probar conexión” para evaluar el payload contra el motor de mapeo."
                    />
                  )}
                </div>
              </TabsPanel>
            </Surface>
          )}
        </div>
      )}

      <IntegrationEditorModal
        open={editor.open}
        integracion={editor.integracion}
        saving={guardar.isPending}
        onClose={() => setEditor({ open: false, integracion: null })}
        onSubmit={handleSave}
      />
    </PageContainer>
  );
}
