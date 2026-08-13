import type { Message } from "@/features/messages/models/message.model";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const formatMessageDate = (message: Message) => {
  const date = message.scheduledAt ?? message.sentAt ?? message.createdAt;

  if (!date) {
    return "Sem data";
  }

  return dateFormatter.format(date.toDate()).split(",").join(" às ");
};
