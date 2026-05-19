import { z } from "zod";

export const messageSchema = z
  .object({
    connectionId: z.string().trim().min(1, "Informe uma conexão."),
    contactIds: z
      .array(z.string().trim().min(1))
      .min(1, "Selecione pelo menos um contato."),
    content: z
      .string()
      .trim()
      .min(2, "Informe uma mensagem com pelo menos 2 caracteres.")
      .max(500, "Use no máximo 500 caracteres."),
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
  });
