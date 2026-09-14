"use client";

import { Fragment, useState } from "react";
import { ArrowRight, ChevronRight, Clock, FileCheck } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Alert } from "@/components/atoms/Alert";
import { InfoTile } from "@/components/molecules/InfoTile";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState";
import { FASES_PIPELINE } from "@/config/workflow";
import type { FaseWorkflow, FormularioDinamico } from "@/types";

interface WorkflowPipelineViewProps {
  formularios: FormularioDinamico[];
  onOpenCatalog: (fase: FaseWorkflow) => void;
  onOpenSimulator: (formId: string) => void;
}

export function WorkflowPipelineView({ formularios, onOpenCatalog, onOpenSimulator }: WorkflowPipelineViewProps) {
  const [selected, setSelected] = useState<FaseWorkflow>("INSPECCION_SEGURIDAD");
  const info = FASES_PIPELINE.find((f) => f.fase === selected) ?? FASES_PIPELINE[0];
  const formsFase = formularios.filter((f) => f.faseWorkflow === selected);
  const Icon = info.icon;

  return (
    <div className="space-y-5">
      <Surface className="p-5">
        <SectionHeading
          title="Secuencia de pasos operativos"
          description={`${formularios.filter((f) => f.activo).length} de ${formularios.length} formularios activos en 8 etapas.`}
          className="mb-4"
        />
        <div className="scrollbar-thin overflow-x-auto pb-1">
          <ol className="flex min-w-[960px] items-stretch gap-2">
            {FASES_PIPELINE.map((fase, idx) => {
              const active = fase.fase === selected;
              const count = formularios.filter((f) => f.faseWorkflow === fase.fase).length;
              const StepIcon = fase.icon;
              return (
                <Fragment key={fase.fase}>
                  <li className="flex-1">
                    <button
                      type="button"
                      onClick={() => setSelected(fase.fase)}
                      aria-pressed={active}
                      className="flex h-full w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors"
                      style={{
                        background: active ? "var(--chip-bg-active)" : "var(--inset-bg)",
                        borderColor: active ? "var(--chip-border-active)" : "var(--inset-border)",
                      }}
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{
                            background: active ? "var(--atom-navy-700)" : "var(--chip-count-bg)",
                            color: active ? "#fff" : "var(--list-text-sub)",
                          }}
                        >
                          {fase.paso}
                        </span>
                        <Badge size="sm" tone={count > 0 ? "green" : "slate"}>
                          {count} {count === 1 ? "form" : "forms"}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--list-text)" }}>
                        <StepIcon size={14} className="shrink-0" style={{ color: active ? "var(--atom-blue-500)" : "var(--list-text-sub)" }} />
                        <span className="line-clamp-2">{fase.nombre}</span>
                      </span>
                      <span className="truncate text-[10.5px]" style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>
                        {fase.responsableRol}
                      </span>
                    </button>
                  </li>
                  {idx < FASES_PIPELINE.length - 1 && (
                    <li aria-hidden="true" className="flex items-center">
                      <ArrowRight size={14} style={{ color: "var(--result-text)" }} />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </div>
      </Surface>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Surface className="space-y-4 p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--kpi-icon-info-bg)", color: "var(--kpi-icon-info-color)" }}>
                <Icon size={18} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--sect-title)" }}>
                  {info.paso}. {info.nombre}
                </h3>
                <span className="text-[11px]" style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>
                  {info.fase}
                </span>
              </div>
            </div>
            <Badge tone="green">Etapa configurada</Badge>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--sect-sub)" }}>
            {info.descripcion}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile label="Rol responsable" value={info.responsableRol} mono />
            <InfoTile label="SLA promedio" value={`${info.slaPromedioMinutos} minutos`} icon={<Clock size={11} />} />
            <InfoTile label="Aprobación supervisor" value={info.requiereAprobacionSupervisor ? "Requerida" : "Automática"} />
          </div>
          <Alert variant="warning" title="Validación requerida">
            {info.politicaBloqueo}
          </Alert>
        </Surface>

        <Surface className="flex flex-col p-5">
          <SectionHeading icon={<FileCheck size={13} />} title={`Formularios de la etapa (${formsFase.length})`} className="mb-3" />
          {formsFase.length === 0 ? (
            <EmptyState title="Sin formularios asignados" description="Crea uno desde el catálogo de formularios." />
          ) : (
            <ul className="space-y-2.5">
              {formsFase.map((frm) => (
                <li key={frm.id} className="rounded-lg border p-3" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
                  <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
                    {frm.codigo}
                  </Badge>
                  <h4 className="mt-1.5 truncate text-[12.5px] font-semibold" style={{ color: "var(--list-text)" }}>
                    {frm.nombre}
                  </h4>
                  <p className="line-clamp-2 text-[11.5px]" style={{ color: "var(--list-text-sub)" }}>
                    {frm.descripcion}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "var(--result-text)" }}>
                      {frm.preguntas.length} campos · v{frm.version}
                    </span>
                    <button type="button" onClick={() => onOpenSimulator(frm.id)} className="flex items-center gap-0.5 text-[12px] font-medium" style={{ color: "var(--atom-blue-500)" }}>
                      Probar <ChevronRight size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => onOpenCatalog(selected)}>
            Abrir en el catálogo
            <ArrowRight size={13} />
          </Button>
        </Surface>
      </div>
    </div>
  );
}
