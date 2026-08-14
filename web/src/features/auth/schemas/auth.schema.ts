import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  name: z.string().optional(),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome."),
  password: z.string().min(6, "Use uma senha com pelo menos 6 caracteres."),
});

export interface AuthFormValues {
  email: string;
  name?: string;
  password: string;
}
