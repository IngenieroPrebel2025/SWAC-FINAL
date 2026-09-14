import { z } from "zod";

export const inspeccionSchema = z
  .object({
    guardaNombre: z.string().min(3, "Nombre del oficial responsable").max(120),
    arlVigente: z.boolean(),
    epsVigente: z.boolean(),
    eppCompleto: z.boolean(),
    soatVigente: z.boolean(),
    tecnomecanicaVigente: z.boolean(),
    inspeccionFurgonLimpio: z.boolean(),
    libreOloresYPlagas: z.boolean(),
    precintosTexto: z.string().max(200),
    precintosCoinciden: z.boolean(),
    temperatura: z.number().min(-25).max(30),
    checklist: z.array(z.object({ id: z.string(), cumple: z.boolean() })),
    resultado: z.enum(["APROBADO", "APROBADO_CON_OBSERVACIONES", "RECHAZADO", "PENDIENTE"]),
    motivoRechazo: z.string().max(300),
    observaciones: z.string().max(500, "Máximo 500 caracteres"),
  })
  .superRefine((d, ctx) => {
    if (d.resultado === "RECHAZADO" && d.motivoRechazo.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivoRechazo"],
        message: "El motivo de rechazo es obligatorio",
      });
    }
  });

export type InspeccionFormData = z.infer<typeof inspeccionSchema>;

export const salidaSchema = z.object({
  guardaNombre: z.string().min(3, "Nombre del oficial de salida").max(120),
  remisionFirmada: z.boolean(),
  furgonVacioOK: z.boolean(),
  estibasRetornadas: z
    .number({ invalid_type_error: "Ingresa un número" })
    .int("Número entero")
    .min(0, "Mínimo 0")
    .max(60, "Máximo 60"),
  novedades: z.string().max(500, "Máximo 500 caracteres"),
});

export type SalidaFormData = z.infer<typeof salidaSchema>;
