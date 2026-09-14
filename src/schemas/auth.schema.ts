import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Ingresa un correo electrónico válido"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const recoverySchema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Ingresa un correo electrónico válido"),
});

export type RecoveryFormData = z.infer<typeof recoverySchema>;
