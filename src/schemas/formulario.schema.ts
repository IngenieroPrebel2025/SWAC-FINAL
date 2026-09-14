import { z } from "zod";

export const FASES_WORKFLOW = [
  "SOLICITUD_PROVEEDOR",
  "DATOS_VEHICULO_CONDUCTOR",
  "VALIDACION_DOCUMENTAL",
  "LLEGADA_PORTERIA",
  "INSPECCION_SEGURIDAD",
  "ASIGNACION_MUELLE",
  "OPERACION_DESCARGUE",
  "SALIDA_PLANTA",
] as const;

export const TIPOS_CAMPO = [
  "TEXTO",
  "TEXTO_LARGO",
  "NUMERO",
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "FECHA",
  "HORA",
  "DOCUMENTO_ADJUNTO",
  "FOTO_EVIDENCIA",
  "FIRMA_DIGITAL",
  "SELECTOR_DEPENDIENTE",
  "CAMPO_CALCULADO",
] as const;

export const formularioMetaSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  codigo: z.string().regex(/^([A-Z0-9-]{3,60})?$/, "Mayúsculas, números y guiones (o vacío para autogenerar)"),
  descripcion: z.string().max(300, "Máximo 300 caracteres"),
  faseWorkflow: z.enum(FASES_WORKFLOW),
  activo: z.boolean(),
});

export type FormularioMetaData = z.infer<typeof formularioMetaSchema>;

const optionalNumber = z.number().optional();

export const preguntaSchema = z
  .object({
    etiqueta: z.string().min(3, "Mínimo 3 caracteres").max(200, "Máximo 200 caracteres"),
    codigoIdentificador: z.string().regex(/^[a-z0-9_]*$/, "Solo minúsculas, números y guion bajo"),
    tipoCampo: z.enum(TIPOS_CAMPO),
    placeholder: z.string().max(120),
    ayudaTexto: z.string().max(200),
    esRequerido: z.boolean(),
    formulaCalculo: z.string().max(200),
    opciones: z.array(
      z.object({
        valor: z.string().min(1, "Valor requerido"),
        etiqueta: z.string().min(1, "Etiqueta requerida"),
      })
    ),
    reglas: z.array(
      z.object({
        id: z.string(),
        campoOrigenId: z.string().min(1, "Selecciona la pregunta origen"),
        operador: z.enum(["IGUAL", "DIFERENTE", "MAYOR_QUE", "MENOR_QUE", "CONTIENE", "NO_CONTIENE", "ES_VERDADERO", "ES_FALSO"]),
        valorComparacion: z.string(),
        accion: z.enum(["MOSTRAR", "OCULTAR", "HACER_REQUERIDO", "DESHABILITAR", "CALCULAR_VALOR"]),
      })
    ),
    min: optionalNumber,
    max: optionalNumber,
    patronRegex: z.string().max(200),
    mensajeError: z.string().max(200),
  })
  .superRefine((data, ctx) => {
    const conOpciones = ["SELECT", "MULTI_SELECT", "SELECTOR_DEPENDIENTE"].includes(data.tipoCampo);
    if (conOpciones && data.opciones.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["opciones"], message: "Agrega al menos una opción" });
    }
    if (data.tipoCampo === "CAMPO_CALCULADO" && !data.formulaCalculo.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["formulaCalculo"], message: "Define la fórmula de cálculo" });
    }
    if (data.min !== undefined && data.max !== undefined && data.min > data.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["max"], message: "El máximo debe ser mayor o igual al mínimo" });
    }
    if (data.patronRegex) {
      try {
        new RegExp(data.patronRegex);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["patronRegex"], message: "Expresión regular inválida" });
      }
    }
  });

export type PreguntaFormData = z.infer<typeof preguntaSchema>;
