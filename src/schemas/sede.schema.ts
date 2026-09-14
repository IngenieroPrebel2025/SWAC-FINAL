import { z } from "zod";

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:MM");
const entero = (min: number, max: number) =>
  z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .int("Debe ser un número entero")
    .min(min, `Mínimo ${min}`)
    .max(max, `Máximo ${max}`);
const decimal = (min: number, max: number) =>
  z.number({ invalid_type_error: "Ingresa un número válido" }).min(min, `Mínimo ${min}`).max(max, `Máximo ${max}`);

export const sedeSchema = z
  .object({
    codigo: z.string().regex(/^[A-Z0-9-]{3,30}$/, "Mayúsculas, números y guiones (3–30)"),
    nombre: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
    direccion: z.string().max(200, "Máximo 200 caracteres"),
    ciudad: z.string().min(2, "La ciudad es requerida"),
    departamentoOEstado: z.string().max(80, "Máximo 80 caracteres"),
    pais: z.string().min(2, "El país es requerido"),
    horarioApertura: hora,
    horarioCierre: hora,
    tiempoSlotMinutosDefecto: entero(10, 240),
    toleranciaImpuntualidadMinutos: entero(0, 120),
    capacidadSimultaneaMuelles: entero(1, 200),
  })
  .refine((d) => d.horarioCierre > d.horarioApertura, {
    message: "El cierre debe ser posterior a la apertura",
    path: ["horarioCierre"],
  });

export type SedeFormData = z.infer<typeof sedeSchema>;

export const muelleSchema = z.object({
  codigoMuelle: z.string().regex(/^[A-Z0-9-]{2,20}$/, "Mayúsculas, números y guiones (ej. M-01)"),
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  tipo: z.enum(["RECEPCION", "DESPACHO", "MIXTO", "DEVOLUCIONES", "CROSS_DOCKING"]),
  materialesPermitidos: z
    .array(z.enum(["SECOS", "REFRIGERADOS", "CONGELADOS", "PELIGROSOS", "VALOR", "GRANEL"]))
    .min(1, "Selecciona al menos un tipo de material"),
  alturaMaximaMetros: decimal(2, 8),
  pesoMaximoToneladas: decimal(1, 80),
  tiempoMaximoOperacionMinutos: entero(15, 600),
  tiempoBufferEntreCitasMinutos: entero(0, 120),
  tieneRampaNiveladora: z.boolean(),
  observaciones: z.string().max(250, "Máximo 250 caracteres"),
});

export type MuelleFormData = z.infer<typeof muelleSchema>;

export const estadoMuelleSchema = z.object({
  estado: z.enum(["DISPONIBLE", "OCUPADO", "MANTENIMIENTO", "INACTIVO", "RESERVADO"]),
  motivo: z.string().min(10, "Describe el motivo (mínimo 10 caracteres)").max(300, "Máximo 300 caracteres"),
});

export type EstadoMuelleFormData = z.infer<typeof estadoMuelleSchema>;
