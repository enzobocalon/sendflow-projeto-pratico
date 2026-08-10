import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PHONE_MAX_LENGTH,
  PHONE_MIN_LENGTH,
  isValidPhone,
} from "@sendflow/shared";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      NAME_MIN_LENGTH,
      `Informe um nome com pelo menos ${NAME_MIN_LENGTH} caracteres.`,
    )
    .max(NAME_MAX_LENGTH, `Use no máximo ${NAME_MAX_LENGTH} caracteres.`),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, {
      message: `Informe um telefone com ${PHONE_MIN_LENGTH} a ${PHONE_MAX_LENGTH} dígitos.`,
    }),
  connectionId: z.string().trim().min(1, "Informe uma conexão."),
});
