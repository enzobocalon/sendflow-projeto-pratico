import { z } from "zod";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "@sendflow/shared";

export const connectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      NAME_MIN_LENGTH,
      `Informe um nome com pelo menos ${NAME_MIN_LENGTH} caracteres.`,
    )
    .max(NAME_MAX_LENGTH, `Use no máximo ${NAME_MAX_LENGTH} caracteres.`),
});
