"use client";

import { useMemo, useState } from "react";
import { Copy, FileCheck, GitCommit, Pencil, Play, Plus, Shield, Sliders, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tabs, TabsPanel } from "@/components/molecules/Tabs";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Field } from "@/components/molecules/Field";
import { Surface } from "@/components/atoms/Surface";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { WorkflowPipelineView } from "@/components/organisms/forms/WorkflowPipelineView";
import { WorkflowRulesMatrix } from "@/components/organisms/forms/WorkflowRulesMatrix";
import { FormRuntimeRenderer } from "@/components/organisms/forms/FormRuntimeRenderer";
import { FormEditorModal } from "@/components/organisms/forms/FormEditorModal";
import {
  useDuplicarFormulario,
  useEliminarFormulario,
  useFormulariosDinamicos,
  useGuardarFormulario,
  useGuardarRespuestaFormulario,
} from "@/hooks/useFormularios";
import { FASES_PIPELINE, FASE_LABEL } from "@/config/workflow";
import { toast } from "@/lib/toast";
import type { FaseWorkflow, FormularioDinamico } from "@/types";

export function WorkflowsView() {
  const { data: formularios = [], isLoading } = useFormulariosDinamicos();
  const guardar = useGuardarFormulario();
  const eliminar = useEliminarFormulario();
  const duplicar = useDuplicarFormulario();
  const guardarRespuesta = useGuardarRespuestaFormulario();

  const [tab, setTab] = useState("pipeline");
  const [search, setSearch] = useState("");
  const [faseFilter, setFaseFilter] = useState("TODAS");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [simulatorId, setSimulatorId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; formulario: FormularioDinamico | null; fase: FaseWorkflow }>({
    open: false,
    formulario: null,
    fase: "INSPECCION_SEGURIDAD",
  });
  const [toDelete, setToDelete] = useState<FormularioDinamico | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return formularios.filter(
      (f) =>
        (!q || f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q) || f.descripcion.toLowerCase().includes(q)) &&
        (faseFilter === "TODAS" || f.faseWorkflow === faseFilter) &&
        (estadoFilter === "TODOS" || (estadoFilter === "ACTIVO" ? f.activo : !f.activo))
    );
  }, [formularios, search, faseFilter, estadoFilter]);

  const simulatorForm = formularios.find((f) => f.id === simulatorId) ?? formularios[0];

  const openSimulator = (id: string) => {
    setSimulatorId(id);
    setTab("simulador");
  };

  const handleSave = (data: Partial<FormularioDinamico>) => {
    guardar.mutate(data, {
      onSuccess: (saved) => {
        toast.success(`Formulario ${saved.codigo} guardado (v${saved.version})`);
        setEditor((prev) => ({ ...prev, open: false, formulario: null }));
        setSimulatorId(saved.id);
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Formularios dinámicos y workflows"
        description="Constructor de formularios, reglas condicionales y políticas de validación en cada etapa del proceso."
        actions={
          <Button leftIcon={<Plus size={15} />} onClick={() => setEditor({ open: true, formulario: null, fase: "INSPECCION_SEGURIDAD" })}>
            Nuevo formulario
          </Button>
        }
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "pipeline", label: "Flujo de etapas", icon: <GitCommit size={14} /> },
          { value: "catalogo", label: "Catálogo", icon: <Sliders size={14} />, badge: formularios.length },
          { value: "simulador", label: "Vista previa", icon: <Play size={14} /> },
          { value: "reglas", label: "Reglas y bloqueos", icon: <Shield size={14} /> },
        ]}
      />

      <TabsPanel value="pipeline" activeValue={tab}>
        <WorkflowPipelineView
          formularios={formularios}
          onOpenSimulator={openSimulator}
          onOpenCatalog={(fase) => {
            setFaseFilter(fase);
            setTab("catalogo");
          }}
        />
      </TabsPanel>

      <TabsPanel value="catalogo" activeValue={tab} className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o descripción…" aria-label="Buscar formularios" containerClassName="sm:max-w-sm" />
          <div className="sm:w-64">
            <Select value={faseFilter} onChange={(e) => setFaseFilter(e.target.value)} aria-label="Filtrar por etapa">
              <option value="TODAS">Todas las etapas</option>
              {FASES_PIPELINE.map((f) => (
                <option key={f.fase} value={f.fase}>
                  {f.paso}. {f.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-44">
            <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} aria-label="Filtrar por estado">
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Solo activos</option>
              <option value="INACTIVO">Solo borradores</option>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={isLoading ? "Cargando formularios…" : "No se encontraron formularios"}
            description={isLoading ? undefined : "Ajusta los filtros o crea un formulario nuevo."}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((frm) => (
              <Surface key={frm.id} className="flex flex-col p-5">
                <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--card-divider)" }}>
                  <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
                    {frm.codigo}
                  </Badge>
                  <StatusBadge status={frm.activo ? "active" : "inactive"} label={frm.activo ? "Activo" : "Borrador"} variant="list" />
                </div>
                <h3 className="mt-3 text-[14px] font-semibold" style={{ color: "var(--card-title)" }}>
                  {frm.nombre}
                </h3>
                <p className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: "var(--card-desc)" }}>
                  {frm.descripcion}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]" style={{ color: "var(--result-text)" }}>
                  <Badge size="sm" tone="blue">
                    {FASE_LABEL[frm.faseWorkflow]}
                  </Badge>
                  {frm.preguntas.length} campos · v{frm.version}
                </div>
                <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ marginTop: 16, borderColor: "var(--card-divider)" }}>
                  <Button variant="secondary" size="sm" leftIcon={<Play size={13} />} onClick={() => openSimulator(frm.id)}>
                    Probar
                  </Button>
                  <div className="flex items-center gap-1">
                    <IconButton
                      label={`Duplicar ${frm.codigo}`}
                      onClick={() => duplicar.mutate(frm.id, { onSuccess: (copia) => toast.success(`Formulario duplicado como ${copia.codigo}`) })}
                    >
                      <Copy size={14} />
                    </IconButton>
                    <IconButton label={`Editar ${frm.codigo}`} onClick={() => setEditor({ open: true, formulario: frm, fase: frm.faseWorkflow })}>
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton label={`Eliminar ${frm.codigo}`} onClick={() => setToDelete(frm)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </TabsPanel>

      <TabsPanel value="simulador" activeValue={tab} className="space-y-4">
        <Surface className="p-4">
          <Field label="Formulario a diligenciar" htmlFor="sim-form" hint="Prueba la reactividad de campos condicionales, validaciones y fórmulas.">
            <Select id="sim-form" value={simulatorForm?.id ?? ""} onChange={(e) => setSimulatorId(e.target.value)}>
              {formularios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.codigo} — {f.nombre}
                </option>
              ))}
            </Select>
          </Field>
        </Surface>
        {simulatorForm ? (
          <FormRuntimeRenderer
            key={`${simulatorForm.id}-${simulatorForm.version}`}
            formulario={simulatorForm}
            onSaveRespuesta={(respuesta) =>
              guardarRespuesta.mutate(respuesta, { onSuccess: () => toast.success("Respuestas validadas y registradas.") })
            }
          />
        ) : (
          <EmptyState title="No hay formularios para previsualizar" />
        )}
      </TabsPanel>

      <TabsPanel value="reglas" activeValue={tab}>
        <WorkflowRulesMatrix />
      </TabsPanel>

      <FormEditorModal
        open={editor.open}
        formulario={editor.formulario}
        faseInicial={editor.fase}
        saving={guardar.isPending}
        onClose={() => setEditor((prev) => ({ ...prev, open: false, formulario: null }))}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Eliminar formulario dinámico?"
        description="Se eliminará la plantilla y sus campos asociados en los flujos operativos."
        itemName={toDelete ? `${toDelete.codigo} — ${toDelete.nombre}` : undefined}
        confirmLabel="Eliminar formulario"
        loading={eliminar.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          eliminar.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(`Formulario ${toDelete.codigo} eliminado`);
              setToDelete(null);
            },
          })
        }
      />
    </PageContainer>
  );
}
