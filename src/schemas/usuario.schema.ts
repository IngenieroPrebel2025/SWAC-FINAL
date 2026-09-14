import { z } from "zod";

export const usuarioSchema = z.object({
  nombreCompleto: z.string().min(3, "Mínimo 3 caracteres").max(150, "Máximo 150 caracteres"),
  email: z.string().min(1, "El correo es requerido").email("Ingresa un correo válido"),
  documentoIdentidad: z.string().regex(/^\d{6,12}$/, "Entre 6 y 12 dígitos numéricos"),
  telefono: z.string().max(30, "Máximo 30 caracteres"),
  cargo: z.string().max(80, "Máximo 80 caracteres"),
  rolId: z.string().min(1, "Selecciona un rol"),
  proveedorId: z.string(),
  sedesAsignadasIds: z.array(z.string()),
  activo: z.boolean(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

export const rolSchema = z.object({
  codigo: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]{2,39}$/, "MAYÚSCULAS_CON_GUION_BAJO (3–40 caracteres)"),
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(80, "Máximo 80 caracteres"),
  descripcion: z.string().max(300, "Máximo 300 caracteres"),
  cloneFromId: z.string(),
});

export type RolFormData = z.infer<typeof rolSchema>;
