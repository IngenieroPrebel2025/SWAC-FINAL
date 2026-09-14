import { z } from "zod";

const int = (min: number, max: number, label: string) =>
  z
    .number({ invalid_type_error: `${label}: ingresa un número válido` })
    .int(`${label}: debe ser un número entero`)
    .min(min, `${label}: mínimo ${min}`)
    .max(max, `${label}: máximo ${max}`);

export const sistemaSchema = z.object({
  dataSourceMode: z.enum(["MOCK", "LIVE_API"]),
  apiBaseUrl: z.string().url("Ingresa una URL válida (https://…)"),
  defaultTimeoutMs: int(1000, 60000, "Timeout"),
  syntheticDelayMs: int(0, 1500, "Latencia"),
  logHttpRequests: z.boolean(),
});

export type SistemaFormData = z.infer<typeof sistemaSchema>;
