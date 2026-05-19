import type { Message } from "../features/messages/types";

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
