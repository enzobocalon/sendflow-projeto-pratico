import { httpsCallable } from "firebase/functions";
import type { MessageStatus } from "../features/messages/types";
import { functions } from "../lib/firebase";

type SaveMessageBaseParams = {
  connectionId: string;
  contactIds: string[];
  content: string;
};

type CreateMessageParams = SaveMessageBaseParams & {
  scheduledAt?: Date;
  status: MessageStatus;
  userId: string;
};

type UpdateMessageParams = SaveMessageBaseParams & {
  messageId: string;
  scheduledAt?: Date;
  status: MessageStatus;
};

export const createMessage = ({
  connectionId,
  contactIds,
  content,
  scheduledAt,
  status,
}: CreateMessageParams) => {
  const createMessageFunction = httpsCallable<
    SaveMessageBaseParams & {
      scheduledAt?: string;
      status: MessageStatus;
    },
    { id: string }
  >(functions, "createMessage");

  return createMessageFunction({
    connectionId,
    contactIds,
    content,
    scheduledAt: scheduledAt?.toISOString(),
    status,
  });
};

export const updateMessage = ({
  connectionId,
  contactIds,
  content,
  messageId,
  scheduledAt,
  status,
}: UpdateMessageParams) => {
  const updateMessageFunction = httpsCallable<
    SaveMessageBaseParams & {
      messageId: string;
      scheduledAt?: string;
      status: MessageStatus;
    },
    { id: string }
  >(functions, "updateMessage");

  return updateMessageFunction({
    connectionId,
    contactIds,
    content,
    messageId,
    scheduledAt: scheduledAt?.toISOString(),
    status,
  });
};

export const deleteMessage = (messageId: string) => {
  const deleteMessageFunction = httpsCallable<
    { messageId: string },
    { id: string }
  >(functions, "deleteMessage");

  return deleteMessageFunction({ messageId });
};
