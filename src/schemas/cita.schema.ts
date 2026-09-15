import { z } from "zod";

const entero = (min: number, max: number, label: string) =>
  z
    .number({ invalid_type_error: `${label}: ingresa un número` })
    .int(`${label}: número entero`)
    .min(min, `${label}: mínimo ${min}`)
    .max(max, `${label}: máximo ${max}`);

export const citaItemSchema = z.object({
  materialId: z.string().min(1, "Selecciona el material"),
  cantidadEstibas: entero(1, 36, "Estibas"),
  cantidadUnidades: entero(1, 100000, "Unidades"),
  cantidadCajasRecipientes: entero(1, 1000, "Cajas o recipientes").optional(),
  cantidadPorCaja: entero(1, 100000, "Cantidad por caja").optional(),
  saldoBodega: entero(0, 100000, "Saldo").optional(),
  ordenCompraNumero: z.string().min(3, "Orden de compra requerida").max(40),
});

export const citaWizardSchema = z.object({
  // Paso 1 — parámetros y carga
  sedeId: z.string().min(1, "Selecciona la sede"),
  proveedorId: z.string().min(1, "Selecciona el proveedor"),
  tipoOperacion: z.enum(["RECEPCION_PROVEEDOR", "DEVOLUCION", "TRANSFERENCIA_INTERNA", "DESPACHO_CLIENTE"]),
  tipoMaterialId: z.string().min(1, "Selecciona el tipo de material"),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida"),
  items: z.array(citaItemSchema).min(1, "Agrega al menos un SKU"),
  esCitaEspecial: z.boolean().default(false),
  motivoCitaEspecial: z.string().max(250, "Máximo 250 caracteres").optional(),
  // Paso 3 — solicitud de información
  correosSolicitud: z.array(z.string().email("Ingresa un correo válido")).min(1, "Agrega al menos un correo de contacto"),
  vehiculoPlaca: z.string().regex(/^[A-Z]{3}-?\d{3}$/i, "Placa inválida (ej. WZM-481)"),
  tipoVehiculo: z.enum(["TRACTOMULA", "DOBLETROQUE", "SENCILLO", "TURBO", "FURGON", "CAMIONETA"]),
  placaRemolque: z.string().max(12),
  empresaTransportadora: z.string().min(3, "Empresa transportadora requerida").max(120),
  conductorNombre: z.string().min(5, "Nombre completo del conductor").max(120),
  conductorCedula: z.string().regex(/^\d{6,12}$/, "Entre 6 y 12 dígitos"),
  conductorTelefono: z.string().min(7, "Teléfono de contacto requerido").max(30),
  conductorArl: z.string().min(2, "ARL requerida"),
  conductorEps: z.string().min(2, "EPS requerida"),
  observaciones: z.string().max(500, "Máximo 500 caracteres"),
}).superRefine((data, ctx) => {
  if (data.esCitaEspecial) {
    const motivo = data.motivoCitaEspecial?.trim() ?? "";
    if (motivo.length < 10) {
      ctx.addIssue({
        path: ["motivoCitaEspecial"],
        code: z.ZodIssueCode.custom,
        message: "Explica el caso único con al menos 10 caracteres",
      });
    }
  }
});

export type CitaWizardData = z.infer<typeof citaWizardSchema>;

export const PASO_1_FIELDS = ["sedeId", "proveedorId", "tipoOperacion", "tipoMaterialId", "fechaCita", "items", "esCitaEspecial", "motivoCitaEspecial"] as const;
export const PASO_3_FIELDS = ["correosSolicitud"] as const;

export const cancelacionSchema = z.object({
  motivo: z.string().min(10, "Describe el motivo (mínimo 10 caracteres)").max(300, "Máximo 300 caracteres"),
});

export type CancelacionData = z.infer<typeof cancelacionSchema>;

export const capacidadSchema = z.object({
  tiempoManiobraMinutos: entero(5, 60, "Maniobra"),
  tiempoBufferEntreCitasMinutos: entero(0, 45, "Buffer"),
  minutosBasePorDefecto: entero(5, 60, "Base"),
  minutosPorEstibaSecos: z.number().min(2).max(12),
  minutosPorEstibaFrio: z.number().min(2).max(15),
  minutosPorEstibaCongelado: z.number().min(3).max(18),
  minutosPorEstibaAseo: z.number().min(2).max(12),
  toleranciaImpuntualidadMinutos: entero(5, 60, "Tolerancia"),
});

export type CapacidadData = z.infer<typeof capacidadSchema>;
