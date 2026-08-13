import { z } from "zod";
import {
  NAME_LENGTH_ERROR_MESSAGE,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from "@sendflow/shared";

export const connectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, NAME_LENGTH_ERROR_MESSAGE)
    .max(NAME_MAX_LENGTH, NAME_LENGTH_ERROR_MESSAGE),
});
