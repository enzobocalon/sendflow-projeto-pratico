import type { MessageStatus } from "../types";

const emptyStateByFilter = {
  all: {
    title: "Nenhuma mensagem encontrada",
    description: "Envie ou agende uma mensagem para acompanhar o histórico.",
  },
  scheduled: {
    title: "Nenhuma mensagem agendada encontrada.",
    description: "Agende uma mensagem para acompanhar os próximos disparos.",
  },
  sent: {
    title: "Nenhuma mensagem enviada encontrada.",
    description: "Envie uma mensagem para que ela apareça neste filtro.",
  },
} satisfies Record<MessageStatus | "all", { title: string; description: string }>;

export const getMessagesListEmptyState = (filter: MessageStatus | "all") =>
  emptyStateByFilter[filter];
