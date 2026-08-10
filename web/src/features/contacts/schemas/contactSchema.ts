import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(80, "Use no máximo 80 caracteres."),
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, {
      message: "Informe um telefone válido.",
    })
    .refine((value) => value.replace(/\D/g, "").length <= 13, {
      message: "Informe um telefone válido.",
    }),
  connectionId: z.string().trim().min(1, "Informe uma conexão."),
});
