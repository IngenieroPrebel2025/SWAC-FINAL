import { z } from "zod";

export const integracionSchema = z.object({
  nombreServicio: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  codigoIdentificador: z
    .string()
    .regex(/^[A-Z0-9-]{3,60}$/, "Usa mayúsculas, números y guiones (3–60)"),
  descripcion: z.string().max(300, "Máximo 300 caracteres"),
  urlBase: z.string().url("Ingresa una URL válida (https://…)"),
  endpoint: z.string().regex(/^\/\S*$/, "Debe iniciar con / y no contener espacios"),
  metodo: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  tipoAutenticacion: z.enum(["NONE", "API_KEY", "BEARER_TOKEN", "OAUTH2", "BASIC_AUTH"]),
  timeoutMs: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .int()
    .min(500, "Mínimo 500 ms")
    .max(60000, "Máximo 60000 ms"),
  reintentosMaximos: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .int()
    .min(0, "Mínimo 0")
    .max(10, "Máximo 10"),
  modoEjecucion: z.enum(["MOCK_SYNTHETIC", "LIVE_REMOTE"]),
});

export type IntegracionFormData = z.infer<typeof integracionSchema>;
