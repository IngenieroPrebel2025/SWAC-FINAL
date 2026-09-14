"use client";

import { useMemo, useState } from "react";
import { Calculator, Camera, CheckCircle2, FileCheck, PenTool, RotateCcw, Send, Sparkles, Upload } from "lucide-react";
import { Surface } from "@/components/atoms/Surface";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Checkbox } from "@/components/atoms/Checkbox";
import { JsonBlock } from "@/components/atoms/JsonBlock";
import { Field } from "@/components/molecules/Field";
import { FASE_LABEL } from "@/config/workflow";
import type { FormularioDinamico, PreguntaFormulario, RespuestaFormularioCita } from "@/types";

type Valor = string | number | boolean | string[];

/** Evaluador aritmético seguro (sin eval): + − × ÷ y paréntesis. */
function evaluateArithmetic(expression: string): number | null {
  const tokens = expression.match(/\d*\.?\d+|[()+\-*/]/g);
  if (!tokens || tokens.join("") !== expression.replace(/\s/g, "")) return null;
  let pos = 0;
  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };
  const parseTerm = (): number => {
    let value = parseFactor();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const right = parseFactor();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  };
  const parseFactor = (): number => {
    if (tokens[pos] === "+") {
      pos++;
      return parseFactor();
    }
    if (tokens[pos] === "-") {
      pos++;
      return -parseFactor();
    }
    if (tokens[pos] === "(") {
      pos++;
      const value = parseExpression();
      if (tokens[pos++] !== ")") throw new Error("Expresión inválida");
      return value;
    }
    const value = Number(tokens[pos++]);
    if (Number.isNaN(value)) throw new Error("Expresión inválida");
    return value;
  };
  try {
    const value = parseExpression();
    return pos === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function initialValues(formulario: FormularioDinamico): Record<string, Valor> {
  return Object.fromEntries(
    formulario.preguntas.map((p) => [p.codigoIdentificador, p.tipoCampo === "CHECKBOX" ? false : p.tipoCampo === "MULTI_SELECT" ? [] : ""])
  );
}

function isVisible(pregunta: PreguntaFormulario, preguntas: PreguntaFormulario[], respuestas: Record<string, Valor>) {
  const reglas = pregunta.reglasCondicionales.filter((r) => r.accion === "MOSTRAR");
  if (reglas.length === 0) return { visible: true, byRule: false };
  const pass = reglas.some((rule) => {
    const origen = preguntas.find((p) => p.id === rule.campoOrigenId);
    if (!origen) return false;
    const v = respuestas[origen.codigoIdentificador];
    const cmp = rule.valorComparacion;
    switch (rule.operador) {
      case "ES_VERDADERO":
        return v === true;
      case "ES_FALSO":
        return v === false || !v;
      case "IGUAL":
        return String(v) === String(cmp);
      case "DIFERENTE":
        return String(v) !== String(cmp);
      case "MAYOR_QUE":
        return Number(v) > Number(cmp);
      case "MENOR_QUE":
        return Number(v) < Number(cmp);
      case "CONTIENE":
        return String(v ?? "").toLowerCase().includes(String(cmp).toLowerCase());
      case "NO_CONTIENE":
        return !String(v ?? "").toLowerCase().includes(String(cmp).toLowerCase());
      default:
        return false;
    }
  });
  return { visible: pass, byRule: pass };
}

interface FormRuntimeRendererProps {
  formulario: FormularioDinamico;
  citaId?: string;
  onSaveRespuesta?: (respuesta: RespuestaFormularioCita) => void;
}

/** Motor de ejecución de formularios dinámicos (reglas condicionales, validaciones, fórmulas). */
export function FormRuntimeRenderer({ formulario, citaId = "CITA-DEMO-2026-0881", onSaveRespuesta }: FormRuntimeRendererProps) {
  const [respuestas, setRespuestas] = useState<Record<string, Valor>>(() => initialValues(formulario));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [payload, setPayload] = useState<RespuestaFormularioCita | null>(null);

  /* Campos calculados derivados (sin efectos): identificadores más largos primero. */
  const valores = useMemo(() => {
    const merged = { ...respuestas };
    const codigos = formulario.preguntas.map((p) => p.codigoIdentificador).sort((a, b) => b.length - a.length);
    formulario.preguntas
      .filter((p) => p.tipoCampo === "CAMPO_CALCULADO" && p.formulaCalculo)
      .forEach((p) => {
        let formula = p.formulaCalculo ?? "";
        codigos.forEach((c) => {
          if (formula.includes(c)) formula = formula.split(c).join(String(Number(respuestas[c]) || 0));
        });
        merged[p.codigoIdentificador] = /^[\d\s+\-*/().]+$/.test(formula) ? evaluateArithmetic(formula) ?? 0 : 0;
      });
    return merged;
  }, [respuestas, formulario.preguntas]);

  const setValor = (codigo: string, valor: Valor) => {
    setRespuestas((prev) => ({ ...prev, [codigo]: valor }));
    setErrores((prev) => {
      if (!prev[codigo]) return prev;
      const next = { ...prev };
      delete next[codigo];
      return next;
    });
  };

  const handleReset = () => {
    setRespuestas(initialValues(formulario));
    setErrores({});
    setPayload(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    formulario.preguntas.forEach((p) => {
      if (!isVisible(p, formulario.preguntas, valores).visible) return;
      const v = valores[p.codigoIdentificador];
      const vacio = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (p.esRequerido && vacio) {
        nuevos[p.codigoIdentificador] = "Este campo es obligatorio para continuar";
        return;
      }
      if (p.tipoCampo === "NUMERO" && v !== "") {
        const n = Number(v);
        if (p.validaciones?.min !== undefined && n < p.validaciones.min) nuevos[p.codigoIdentificador] = `El valor mínimo es ${p.validaciones.min}`;
        if (p.validaciones?.max !== undefined && n > p.validaciones.max) nuevos[p.codigoIdentificador] = `El valor máximo es ${p.validaciones.max}`;
      }
      if (p.validaciones?.patronRegex && v) {
        try {
          if (!new RegExp(p.validaciones.patronRegex).test(String(v))) {
            nuevos[p.codigoIdentificador] = p.validaciones.mensajeError || "El formato ingresado no es válido";
          }
        } catch {
          /* regex inválida: se ignora */
        }
      }
    });

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const respuesta: RespuestaFormularioCita = {
      id: `resp-${Date.now()}`,
      citaId,
      formularioId: formulario.id,
      faseWorkflow: formulario.faseWorkflow,
      respuestasPorCampo: { ...valores },
      completadoPorUsuarioId: "usr-operador-demo",
      completadoEn: new Date().toISOString(),
    };
    setPayload(respuesta);
    onSaveRespuesta?.(respuesta);
  };

  const uploadButton = (codigo: string, tipo: "DOC" | "FOTO") => (
    <button
      type="button"
      onClick={() =>
        setValor(
          codigo,
          tipo === "FOTO"
            ? "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500"
            : "https://storage.swac.com/docs/manifiesto_rndc_9941.pdf"
        )
      }
      className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors hover:border-[var(--atom-blue-500)]"
      style={{ borderColor: "var(--ctrl-border)", background: "var(--ctrl-bg)" }}
    >
      {tipo === "FOTO" ? <Camera size={20} style={{ color: "var(--ctrl-text)" }} /> : <Upload size={20} style={{ color: "var(--ctrl-text)" }} />}
      <span className="text-[12.5px] font-medium" style={{ color: "var(--list-text)" }}>
        {tipo === "FOTO" ? "Tomar o subir fotografía" : "Cargar documento PDF"}
      </span>
      <span className="text-[11px]" style={{ color: "var(--list-text-sub)" }}>
        Simulación de carga de archivo
      </span>
    </button>
  );

  return (
    <div className="space-y-5">
      <Surface className="p-5">
        <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--card-divider)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Badge size="sm" tone="slate" style={{ fontFamily: "var(--font-mono)" }}>
                {formulario.codigo}
              </Badge>
              <span className="text-[11px]" style={{ color: "var(--result-text)" }}>
                v{formulario.version}
              </span>
            </div>
            <h3 className="mt-1.5 text-[16px] font-semibold" style={{ color: "var(--sect-title)" }}>
              {formulario.nombre}
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--sect-sub)" }}>
              {formulario.descripcion}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{FASE_LABEL[formulario.faseWorkflow]}</Badge>
            <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={13} />} onClick={handleReset}>
              Limpiar
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formulario.preguntas.map((p, idx) => {
            const { visible, byRule } = isVisible(p, formulario.preguntas, valores);
            if (!visible) return null;
            const id = `rt-${p.id}`;
            const valor = valores[p.codigoIdentificador];
            const error = errores[p.codigoIdentificador];

            return (
              <div
                key={p.id}
                className="rounded-lg border p-4"
                style={{
                  background: byRule ? "var(--st-active-bg)" : "var(--inset-bg)",
                  borderColor: byRule ? "rgba(114,166,137,0.35)" : "var(--inset-border)",
                }}
              >
                <Field label={`${idx + 1}. ${p.etiqueta}`} htmlFor={id} required={p.esRequerido} error={error} hint={p.ayudaTexto}>
                  {byRule && (
                    <Badge size="sm" tone="green" className="self-start">
                      <Sparkles size={11} /> Visible por regla condicional
                    </Badge>
                  )}
                  {p.tipoCampo === "TEXTO" && (
                    <Input id={id} value={String(valor ?? "")} placeholder={p.placeholder} invalid={!!error} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)} />
                  )}
                  {p.tipoCampo === "TEXTO_LARGO" && (
                    <Textarea id={id} rows={3} value={String(valor ?? "")} placeholder={p.placeholder} invalid={!!error} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)} />
                  )}
                  {p.tipoCampo === "NUMERO" && (
                    <Input id={id} type="number" className="max-w-xs" value={String(valor ?? "")} placeholder={p.placeholder} invalid={!!error} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)} />
                  )}
                  {(p.tipoCampo === "SELECT" || p.tipoCampo === "SELECTOR_DEPENDIENTE") && (
                    <Select id={id} value={String(valor ?? "")} invalid={!!error} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)}>
                      <option value="">Seleccionar opción…</option>
                      {p.opciones?.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.etiqueta}
                        </option>
                      ))}
                    </Select>
                  )}
                  {p.tipoCampo === "MULTI_SELECT" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {p.opciones?.map((o) => {
                        const list = Array.isArray(valor) ? valor : [];
                        return (
                          <Checkbox
                            key={o.valor}
                            id={`${id}-${o.valor}`}
                            label={o.etiqueta}
                            checked={list.includes(o.valor)}
                            onChange={(e) =>
                              setValor(p.codigoIdentificador, e.target.checked ? [...list, o.valor] : list.filter((x) => x !== o.valor))
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                  {p.tipoCampo === "CHECKBOX" && (
                    <Checkbox id={id} label={valor ? "Confirmado / Sí" : "No marcado / No"} checked={Boolean(valor)} onChange={(e) => setValor(p.codigoIdentificador, e.target.checked)} />
                  )}
                  {p.tipoCampo === "FECHA" && (
                    <Input id={id} type="date" className="max-w-xs" value={String(valor ?? "")} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)} />
                  )}
                  {p.tipoCampo === "HORA" && (
                    <Input id={id} type="time" className="max-w-xs" value={String(valor ?? "")} onChange={(e) => setValor(p.codigoIdentificador, e.target.value)} />
                  )}
                  {p.tipoCampo === "DOCUMENTO_ADJUNTO" &&
                    (valor ? (
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: "rgba(114,166,137,0.35)", background: "var(--ctrl-bg)" }}>
                        <span className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--list-text)" }}>
                          <FileCheck size={16} style={{ color: "var(--atom-green-500)" }} /> documento_radicado.pdf
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setValor(p.codigoIdentificador, "")}>
                          Quitar
                        </Button>
                      </div>
                    ) : (
                      uploadButton(p.codigoIdentificador, "DOC")
                    ))}
                  {p.tipoCampo === "FOTO_EVIDENCIA" &&
                    (valor ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: "rgba(114,166,137,0.35)", background: "var(--ctrl-bg)" }}>
                        <span className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={String(valor)} alt="Evidencia capturada" className="h-12 w-16 rounded-md object-cover" />
                          <span className="text-[12.5px]" style={{ color: "var(--list-text)" }}>
                            evidencia_fotografica.jpg
                          </span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setValor(p.codigoIdentificador, "")}>
                          Retomar
                        </Button>
                      </div>
                    ) : (
                      uploadButton(p.codigoIdentificador, "FOTO")
                    ))}
                  {p.tipoCampo === "FIRMA_DIGITAL" &&
                    (String(valor).startsWith("FIRMA_") ? (
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: "rgba(114,166,137,0.35)", background: "var(--ctrl-bg)" }}>
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={16} style={{ color: "var(--atom-green-500)" }} />
                          <span>
                            <span className="block text-[12.5px] font-medium" style={{ color: "var(--list-text)" }}>
                              Firma digital registrada
                            </span>
                            <span className="block text-[10.5px]" style={{ color: "var(--list-text-sub)", fontFamily: "var(--font-mono)" }}>
                              {String(valor)}
                            </span>
                          </span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setValor(p.codigoIdentificador, "")}>
                          Limpiar
                        </Button>
                      </div>
                    ) : (
                      <Button variant="secondary" leftIcon={<PenTool size={14} />} onClick={() => setValor(p.codigoIdentificador, `FIRMA_DIGITAL_VERIFICADA_${Date.now()}`)} className="self-start">
                        Estampar firma digital
                      </Button>
                    ))}
                  {p.tipoCampo === "CAMPO_CALCULADO" && (
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ background: "var(--kpi-icon-info-bg)", borderColor: "var(--chip-border-active)" }}>
                      <span className="flex items-center gap-2 text-[12px]" style={{ color: "var(--list-text)" }}>
                        <Calculator size={14} style={{ color: "var(--atom-blue-500)" }} />
                        <code style={{ fontFamily: "var(--font-mono)" }}>{p.formulaCalculo}</code>
                      </span>
                      <strong className="text-[15px]" style={{ color: "var(--kpi-value)", fontFamily: "var(--font-mono)" }}>
                        {String(valor ?? 0)}
                      </strong>
                    </div>
                  )}
                </Field>
              </div>
            );
          })}

          <div className="flex justify-end border-t pt-4" style={{ borderColor: "var(--card-divider)" }}>
            <Button type="submit" leftIcon={<Send size={14} />}>
              Validar y enviar respuestas
            </Button>
          </div>
        </form>
      </Surface>

      {payload && <JsonBlock title="Payload generado · RespuestaFormularioCita" data={payload} maxHeight={420} />}
    </div>
  );
}
