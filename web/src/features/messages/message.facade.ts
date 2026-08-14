import { createMessage, upsertMessage, type Message } from "./message.model";
import type { MessageFormValues } from "./message.schema";

interface HandleSaveMessageParams {
  editingMessage: Message | null;
  values: MessageFormValues;
}

export async function handleSaveMessage(params: HandleSaveMessageParams) {
  const { editingMessage, values } = params;
  const isScheduled = values.sendMode === "scheduled";
  const commonMessageData = {
    connectionId: values.connectionId,
    contactIds: values.contactIds,
    content: values.content,
  };
  const messageData = isScheduled
    ? {
        ...commonMessageData,
        scheduledAt: new Date(
          `${values.scheduledDate}T${values.scheduledTime}`,
        ),
        status: "scheduled" as const,
      }
    : {
        ...commonMessageData,
        status: "sent" as const,
      };

  if (editingMessage) {
    await upsertMessage({
      ...messageData,
      messageId: editingMessage.id,
    });
  } else {
    await createMessage(messageData);
  }

  return { isScheduled };
}
