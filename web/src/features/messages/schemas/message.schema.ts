import { z } from "zod";
import {
  MAX_MESSAGE_CONTACTS,
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
  hasUniqueValues,
  isFutureDate,
  parseDate,
} from "@sendflow/shared";

export interface MessageFormValues {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  sendMode: "now" | "scheduled";
}

export const messageSchema = z
  .object({
    connectionId: z.string().trim().min(1, "Informe uma conexão."),
    contactIds: z
      .array(z.string().trim().min(1))
      .min(1, "Selecione pelo menos um contato.")
      .max(
        MAX_MESSAGE_CONTACTS,
        `Selecione no máximo ${MAX_MESSAGE_CONTACTS} contatos por mensagem.`,
      )
      .refine(hasUniqueValues, "Existem contatos duplicados."),
    content: z
      .string()
      .trim()
      .min(
        MESSAGE_CONTENT_MIN_LENGTH,
        `Informe uma mensagem com pelo menos ${MESSAGE_CONTENT_MIN_LENGTH} caracteres.`,
      )
      .max(
        MESSAGE_CONTENT_MAX_LENGTH,
        `Use no máximo ${MESSAGE_CONTENT_MAX_LENGTH} caracteres.`,
      ),
    scheduledDate: z.string().trim(),
    scheduledTime: z.string().trim(),
    sendMode: z.enum(["now", "scheduled"]),
  })
  .superRefine(({ scheduledDate, scheduledTime, sendMode }, context) => {
    if (sendMode !== "scheduled") {
      return;
    }

    if (!scheduledDate) {
      context.addIssue({
        code: "custom",
        message: "Informe a data do agendamento.",
        path: ["scheduledDate"],
      });
    }

    if (!scheduledTime) {
      context.addIssue({
        code: "custom",
        message: "Informe o horário do agendamento.",
        path: ["scheduledTime"],
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return;
    }

    const scheduledAt = parseDate(`${scheduledDate}T${scheduledTime}`);

    if (!scheduledAt) {
      context.addIssue({
        code: "custom",
        message: "Informe uma data e horário válidos.",
        path: ["scheduledDate"],
      });
      return;
    }

    if (!isFutureDate(scheduledAt)) {
      context.addIssue({
        code: "custom",
        message: "Agende a mensagem para uma data futura.",
        path: ["scheduledDate"],
      });
    }
  });
