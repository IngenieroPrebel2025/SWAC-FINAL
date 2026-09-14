"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/molecules/Modal";
import { Field } from "@/components/molecules/Field";
import { Tabs } from "@/components/molecules/Tabs";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { Alert } from "@/components/atoms/Alert";
import { IconButton } from "@/components/atoms/IconButton";
import { Badge } from "@/components/atoms/Badge";
import { preguntaSchema, type PreguntaFormData } from "@/schemas/formulario.schema";
import { TIPOS_CAMPO_INFO } from "@/config/workflow";
import type { PreguntaFormulario } from "@/types";

interface QuestionEditorModalProps {
  open: boolean;
  pregunta: PreguntaFormulario | null;
  otrasPreguntas: PreguntaFormulario[];
  onClose: () => void;
  onSave: (pregunta: PreguntaFormulario) => void;
}

const EMPTY: PreguntaFormData = {
  etiqueta: "",
  codigoIdentificador: "",
  tipoCampo: "TEXTO",
  placeholder: "",
  ayudaTexto: "",
  esRequerido: true,
  formulaCalculo: "",
  opciones: [
    { valor: "OPCION_1", etiqueta: "Opción 1" },
    { valor: "OPCION_2", etiqueta: "Opción 2" },
  ],
  reglas: [],
  min: undefined,
  max: undefined,
  patronRegex: "",
  mensajeError: "",
};

const optionalNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

export function QuestionEditorModal({ open, pregunta, otrasPreguntas, onClose, onSave }: QuestionEditorModalProps) {
  const [tab, setTab] = useState("general");
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, submitCount, isValid },
  } = useForm<PreguntaFormData>({ resolver: zodResolver(preguntaSchema), defaultValues: EMPTY });

  const opciones = useFieldArray({ control, name: "opciones" });
  const reglas = useFieldArray({ control, name: "reglas" });

  useEffect(() => {
    if (!open) return;
    setTab("general");
    setNuevaEtiqueta("");
    reset(
      pregunta
        ? {
            etiqueta: pregunta.etiqueta,
            codigoIdentificador: pregunta.codigoIdentificador,
            tipoCampo: pregunta.tipoCampo,
            placeholder: pregunta.placeholder ?? "",
            ayudaTexto: pregunta.ayudaTexto ?? "",
            esRequerido: pregunta.esRequerido,
            formulaCalculo: pregunta.formulaCalculo ?? "",
            opciones: pregunta.opciones?.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })) ?? [],
            reglas: pregunta.reglasCondicionales.map((r) => ({
              id: r.id,
              campoOrigenId: r.campoOrigenId,
              operador: r.operador,
              valorComparacion: String(r.valorComparacion ?? ""),
              accion: r.accion,
            })),
            min: pregunta.validaciones?.min,
            max: pregunta.validaciones?.max,
            patronRegex: pregunta.validaciones?.patronRegex ?? "",
            mensajeError: pregunta.validaciones?.mensajeError ?? "",
          }
        : EMPTY
    );
  }, [open, pregunta, reset]);

  const tipoCampo = watch("tipoCampo");
  const esRequerido = watch("esRequerido");
  const reglasValues = watch("reglas");
  const conOpciones = ["SELECT", "MULTI_SELECT", "SELECTOR_DEPENDIENTE"].includes(tipoCampo);

  const addOpcion = () => {
    const etiqueta = nuevaEtiqueta.trim();
    if (!etiqueta) return;
    opciones.append({ etiqueta, valor: slugify(etiqueta).toUpperCase() || `OPCION_${opciones.fields.length + 1}` });
    setNuevaEtiqueta("");
  };

  const submit = handleSubmit((data) => {
    onSave({
      id: pregunta?.id ?? `p-${Date.now()}`,
      formularioId: pregunta?.formularioId ?? "",
      codigoIdentificador: data.codigoIdentificador.trim() || slugify(data.etiqueta),
      etiqueta: data.etiqueta.trim(),
      tipoCampo: data.tipoCampo,
      placeholder: data.placeholder || undefined,
      ayudaTexto: data.ayudaTexto || undefined,
      orden: pregunta?.orden ?? 1,
      esRequerido: data.esRequerido,
      opciones: conOpciones ? data.opciones : undefined,
      formulaCalculo: data.tipoCampo === "CAMPO_CALCULADO" ? data.formulaCalculo : undefined,
      reglasCondicionales: data.reglas.map((r) => ({
        ...r,
        valorComparacion: r.operador === "ES_VERDADERO" ? true : r.operador === "ES_FALSO" ? false : r.valorComparacion,
      })),
      validaciones: {
        min: data.min,
        max: data.max,
        patronRegex: data.patronRegex || undefined,
        mensajeError: data.mensajeError || undefined,
      },
    });
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={pregunta ? "Editar campo" : "Nuevo campo del formulario"}
      description="Tipo de entrada, validaciones y lógica condicional reactiva."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>{pregunta ? "Guardar cambios" : "Agregar campo"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "general", label: "General" },
            ...(conOpciones ? [{ value: "opciones", label: "Opciones", badge: opciones.fields.length }] : []),
            { value: "reglas", label: "Lógica condicional", badge: reglas.fields.length },
            { value: "validaciones", label: "Validaciones" },
          ]}
        />

        {submitCount > 0 && !isValid && (
          <Alert variant="error" title="Revisa la configuración">
            Hay campos con errores. Verifica las pestañas General, Opciones y Validaciones.
          </Alert>
        )}

        {tab === "general" && (
          <div className="space-y-4">
            <Field label="Etiqueta / pregunta visible" htmlFor="q-etiqueta" required error={errors.etiqueta?.message}>
              <Input id="q-etiqueta" placeholder="¿El vehículo cuenta con precinto de seguridad intacto?" invalid={!!errors.etiqueta} {...register("etiqueta")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Identificador (clave JSON)" htmlFor="q-codigo" error={errors.codigoIdentificador?.message} hint="Vacío = se genera desde la etiqueta">
                <Input id="q-codigo" placeholder="tiene_precinto_seguridad" style={{ fontFamily: "var(--font-mono)" }} invalid={!!errors.codigoIdentificador} {...register("codigoIdentificador")} />
              </Field>
              <Field label="Tipo de campo" htmlFor="q-tipo" required>
                <Select id="q-tipo" {...register("tipoCampo")}>
                  {TIPOS_CAMPO_INFO.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Placeholder" htmlFor="q-ph">
                <Input id="q-ph" {...register("placeholder")} />
              </Field>
              <Field label="Texto de ayuda" htmlFor="q-ayuda">
                <Input id="q-ayuda" {...register("ayudaTexto")} />
              </Field>
            </div>
            {tipoCampo === "CAMPO_CALCULADO" && (
              <Field label="Fórmula de cálculo" htmlFor="q-formula" required error={errors.formulaCalculo?.message} hint="Usa identificadores de otros campos numéricos, p. ej. peso_bruto - peso_tara">
                <Input id="q-formula" style={{ fontFamily: "var(--font-mono)" }} invalid={!!errors.formulaCalculo} {...register("formulaCalculo")} />
              </Field>
            )}
            <Switch
              id="q-req"
              label="Campo obligatorio"
              description="Requerido para avanzar de etapa."
              checked={esRequerido}
              onChange={(v) => setValue("esRequerido", v)}
            />
          </div>
        )}

        {tab === "opciones" && conOpciones && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={nuevaEtiqueta}
                onChange={(e) => setNuevaEtiqueta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOpcion();
                  }
                }}
                placeholder="Etiqueta visible (ej. Seguros SURA)"
                aria-label="Nueva opción"
              />
              <Button variant="secondary" leftIcon={<Plus size={14} />} onClick={addOpcion}>
                Añadir
              </Button>
            </div>
            {errors.opciones?.message && (
              <p role="alert" className="text-[11.5px]" style={{ color: "var(--atom-coral-500)" }}>
                {errors.opciones.message}
              </p>
            )}
            <ul className="space-y-2">
              {opciones.fields.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[1fr_160px_auto] items-center gap-2">
                  <Input aria-label={`Etiqueta opción ${i + 1}`} {...register(`opciones.${i}.etiqueta`)} invalid={!!errors.opciones?.[i]?.etiqueta} />
                  <Input aria-label={`Valor opción ${i + 1}`} style={{ fontFamily: "var(--font-mono)" }} {...register(`opciones.${i}.valor`)} invalid={!!errors.opciones?.[i]?.valor} />
                  <IconButton label={`Eliminar opción ${i + 1}`} onClick={() => opciones.remove(i)}>
                    <Trash2 size={14} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "reglas" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
                Muestra u oculta este campo según las respuestas de otras preguntas.
              </p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={13} />}
                disabled={otrasPreguntas.length === 0}
                onClick={() =>
                  reglas.append({
                    id: `r-${Date.now()}`,
                    campoOrigenId: otrasPreguntas[0]?.id ?? "",
                    operador: "ES_VERDADERO",
                    valorComparacion: "",
                    accion: "MOSTRAR",
                  })
                }
              >
                Agregar regla
              </Button>
            </div>
            {otrasPreguntas.length === 0 ? (
              <Alert variant="info">Agrega otras preguntas al formulario para poder evaluar condiciones.</Alert>
            ) : reglas.fields.length === 0 ? (
              <EmptyState title="Sin reglas condicionales" description="Este campo siempre será visible." />
            ) : (
              <ul className="space-y-3">
                {reglas.fields.map((f, i) => {
                  const operador = reglasValues?.[i]?.operador;
                  return (
                    <li key={f.id} className="space-y-3 rounded-lg border p-3" style={{ background: "var(--inset-bg)", borderColor: "var(--inset-border)" }}>
                      <div className="flex items-center justify-between">
                        <Badge size="sm" tone="navy">
                          SI se cumple la condición
                        </Badge>
                        <IconButton label={`Eliminar regla ${i + 1}`} onClick={() => reglas.remove(i)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Pregunta origen" htmlFor={`r-origen-${i}`}>
                          <Select id={`r-origen-${i}`} {...register(`reglas.${i}.campoOrigenId`)}>
                            {otrasPreguntas.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.etiqueta}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Operador" htmlFor={`r-op-${i}`}>
                          <Select id={`r-op-${i}`} {...register(`reglas.${i}.operador`)}>
                            <option value="ES_VERDADERO">Es verdadero</option>
                            <option value="ES_FALSO">Es falso</option>
                            <option value="IGUAL">Es igual a</option>
                            <option value="DIFERENTE">Es diferente de</option>
                            <option value="MAYOR_QUE">Mayor que</option>
                            <option value="MENOR_QUE">Menor que</option>
                            <option value="CONTIENE">Contiene</option>
                            <option value="NO_CONTIENE">No contiene</option>
                          </Select>
                        </Field>
                        <Field label="Acción" htmlFor={`r-acc-${i}`}>
                          <Select id={`r-acc-${i}`} {...register(`reglas.${i}.accion`)}>
                            <option value="MOSTRAR">Mostrar campo</option>
                            <option value="OCULTAR">Ocultar campo</option>
                            <option value="HACER_REQUERIDO">Hacer obligatorio</option>
                            <option value="DESHABILITAR">Deshabilitar</option>
                          </Select>
                        </Field>
                      </div>
                      {operador !== "ES_VERDADERO" && operador !== "ES_FALSO" && (
                        <Field label="Valor de comparación" htmlFor={`r-val-${i}`}>
                          <Input id={`r-val-${i}`} {...register(`reglas.${i}.valorComparacion`)} />
                        </Field>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {tab === "validaciones" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor mínimo" htmlFor="q-min" error={errors.min?.message}>
              <Input id="q-min" type="number" {...register("min", { setValueAs: optionalNumber })} />
            </Field>
            <Field label="Valor máximo" htmlFor="q-max" error={errors.max?.message}>
              <Input id="q-max" type="number" invalid={!!errors.max} {...register("max", { setValueAs: optionalNumber })} />
            </Field>
            <Field label="Expresión regular" htmlFor="q-regex" error={errors.patronRegex?.message} className="sm:col-span-2">
              <Input id="q-regex" placeholder="^[0-9]{6,12}$" style={{ fontFamily: "var(--font-mono)" }} invalid={!!errors.patronRegex} {...register("patronRegex")} />
            </Field>
            <Field label="Mensaje de error personalizado" htmlFor="q-msg" className="sm:col-span-2">
              <Input id="q-msg" {...register("mensajeError")} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
