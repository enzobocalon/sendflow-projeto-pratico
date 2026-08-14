import type { MessageStatus } from "@sendflow/shared";

import {
  createMessage,
  upsertMessage,
  type Message,
} from "../models/message.model";
import type { MessageFormValues } from "../schemas/message.schema";

interface HandleSaveMessageParams {
  editingMessage: Message | null;
  values: MessageFormValues;
}

export async function handleSaveMessage(params: HandleSaveMessageParams) {
  const { editingMessage, values } = params;
  const isScheduled = values.sendMode === "scheduled";
  const scheduledAt = isScheduled
    ? new Date(`${values.scheduledDate}T${values.scheduledTime}`)
    : undefined;
  const status: MessageStatus = isScheduled ? "scheduled" : "sent";
  const messageData = {
    connectionId: values.connectionId,
    contactIds: values.contactIds,
    content: values.content,
    scheduledAt,
    status,
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
