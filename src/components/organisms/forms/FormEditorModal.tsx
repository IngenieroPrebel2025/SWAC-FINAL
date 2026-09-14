"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Copy, Layers, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/molecules/EmptyState";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { QuestionEditorModal } from "./QuestionEditorModal";
import { formularioMetaSchema, type FormularioMetaData } from "@/schemas/formulario.schema";
import { FASES_PIPELINE, TIPO_CAMPO_LABEL } from "@/config/workflow";
import type { FaseWorkflow, FormularioDinamico, PreguntaFormulario } from "@/types";

interface FormEditorModalProps {
  open: boolean;
  formulario: FormularioDinamico | null;
  faseInicial: FaseWorkflow;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<FormularioDinamico>) => void;
}

export function FormEditorModal({ open, formulario, faseInicial, saving, onClose, onSubmit }: FormEditorModalProps) {
  const [preguntas, setPreguntas] = useState<PreguntaFormulario[]>([]);
  const [questionEditor, setQuestionEditor] = useState<{ open: boolean; pregunta: PreguntaFormulario | null }>({
    open: false,
    pregunta: null,
  });
  const [toDelete, setToDelete] = useState<PreguntaFormulario | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormularioMetaData>({ resolver: zodResolver(formularioMetaSchema) });

  useEffect(() => {
    if (!open) return;
    reset({
      nombre: formulario?.nombre ?? "",
      codigo: formulario?.codigo ?? "",
      descripcion: formulario?.descripcion ?? "",
      faseWorkflow: formulario?.faseWorkflow ?? faseInicial,
      activo: formulario?.activo ?? true,
    });
    setPreguntas(formulario?.preguntas ?? []);
  }, [open, formulario, faseInicial, reset]);

  const activo = watch("activo");

  const move = (index: number, delta: -1 | 1) => {
    setPreguntas((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const duplicate = (p: PreguntaFormulario) =>
    setPreguntas((prev) => [
      ...prev,
      { ...p, id: `p-${Date.now()}`, codigoIdentificador: `${p.codigoIdentificador}_copia`, etiqueta: `${p.etiqueta} (copia)` },
    ]);

  const handleSaveQuestion = (pregunta: PreguntaFormulario) => {
    setPreguntas((prev) =>
      prev.some((p) => p.id === pregunta.id) ? prev.map((p) => (p.id === pregunta.id ? pregunta : p)) : [...prev, pregunta]
    );
  };

  const submit = handleSubmit((meta) => {
    onSubmit({
      id: formulario?.id,
      codigo: meta.codigo || `FRM-${meta.faseWorkflow.slice(0, 8)}-${Math.floor(Math.random() * 900 + 100)}`,
      nombre: meta.nombre.trim(),
      descripcion: meta.descripcion.trim(),
      faseWorkflow: meta.faseWorkflow,
      activo: meta.activo,
      preguntas: preguntas.map((p, i) => ({ ...p, orden: i + 1, formularioId: formulario?.id ?? p.formularioId })),
    });
  });

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        title={formulario ? "Editar formulario dinámico" : "Nuevo formulario de workflow"}
        description="Campos, validaciones y etapa operativa asociada."
        footer={
          <>
            <div className="mr-auto">
              <Switch id="frm-activo" size="sm" label="Publicado en producción" checked={activo} onChange={(v) => setValue("activo", v)} />
            </div>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={saving}>
              Guardar formulario
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <form onSubmit={(e) => e.preventDefault()} noValidate className="grid gap-4 md:grid-cols-3">
            <Field label="Nombre del formulario" htmlFor="frm-nombre" required error={errors.nombre?.message} className="md:col-span-2">
              <Input id="frm-nombre" placeholder="Inspección de precintos y cadena de frío" invalid={!!errors.nombre} {...register("nombre")} />
            </Field>
            <Field label="Código" htmlFor="frm-codigo" error={errors.codigo?.message} hint="Vacío = autogenerado">
              <Input
                id="frm-codigo"
                style={{ fontFamily: "var(--font-mono)" }}
                invalid={!!errors.codigo}
                {...register("codigo", { setValueAs: (v: string) => v.trim().toUpperCase() })}
              />
            </Field>
            <Field label="Descripción y propósito" htmlFor="frm-desc" error={errors.descripcion?.message} className="md:col-span-2">
              <Input id="frm-desc" {...register("descripcion")} />
            </Field>
            <Field label="Etapa del proceso" htmlFor="frm-fase" required>
              <Select id="frm-fase" {...register("faseWorkflow")}>
                {FASES_PIPELINE.map((f) => (
                  <option key={f.fase} value={f.fase}>
                    {f.paso}. {f.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </form>

          <div>
            <SectionHeading
              icon={<Layers size={13} />}
              title={`Campos del formulario (${preguntas.length})`}
              actions={
                <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setQuestionEditor({ open: true, pregunta: null })}>
                  Añadir campo
                </Button>
              }
              className="mb-3"
            />
            {preguntas.length === 0 ? (
              <EmptyState title="Aún no hay campos" description="Agrega textos, fotos, checklists o firmas digitales." />
            ) : (
              <ol className="space-y-2">
                {preguntas.map((p, idx) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: "var(--chip-count-bg)", color: "var(--list-text-sub)" }}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[12.5px] font-medium" style={{ color: "var(--list-text)" }}>
                            {p.etiqueta}
                          </span>
                          <Badge size="sm" tone="slate">
                            {TIPO_CAMPO_LABEL[p.tipoCampo]}
                          </Badge>
                          {p.esRequerido && (
                            <Badge size="sm" tone="coral">
                              Requerido
                            </Badge>
                          )}
                          {p.reglasCondicionales.length > 0 && (
                            <Badge size="sm" tone="amber">
                              <Sparkles size={10} /> {p.reglasCondicionales.length} regla(s)
                            </Badge>
                          )}
                        </div>
                        <span className="block text-[10.5px]" style={{ color: "var(--result-text)", fontFamily: "var(--font-mono)" }}>
                          {p.codigoIdentificador}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <IconButton label="Mover arriba" disabled={idx === 0} onClick={() => move(idx, -1)} className="disabled:opacity-30">
                        <ArrowUp size={14} />
                      </IconButton>
                      <IconButton label="Mover abajo" disabled={idx === preguntas.length - 1} onClick={() => move(idx, 1)} className="disabled:opacity-30">
                        <ArrowDown size={14} />
                      </IconButton>
                      <IconButton label="Duplicar campo" onClick={() => duplicate(p)}>
                        <Copy size={14} />
                      </IconButton>
                      <IconButton label="Editar campo" onClick={() => setQuestionEditor({ open: true, pregunta: p })}>
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton label="Eliminar campo" onClick={() => setToDelete(p)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Modal>

      <QuestionEditorModal
        open={questionEditor.open}
        pregunta={questionEditor.pregunta}
        otrasPreguntas={preguntas.filter((p) => p.id !== questionEditor.pregunta?.id)}
        onClose={() => setQuestionEditor({ open: false, pregunta: null })}
        onSave={handleSaveQuestion}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Eliminar este campo?"
        description="El campo y sus reglas condicionales se quitarán del formulario al guardar."
        itemName={toDelete?.etiqueta}
        confirmLabel="Eliminar campo"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          setPreguntas((prev) => prev.filter((p) => p.id !== toDelete?.id));
          setToDelete(null);
        }}
      />
    </>
  );
}
