import type { MessageStatus } from "../features/messages/types";
import {
  callFirebaseFunction,
  type MutationResponse,
} from "./firebase-callable";

type SaveMessageBaseParams = {
  connectionId: string;
  contactIds: string[];
  content: string;
};

type CreateMessageParams = SaveMessageBaseParams & {
  scheduledAt?: Date;
  status: MessageStatus;
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
}: CreateMessageParams) =>
  callFirebaseFunction<
    SaveMessageBaseParams & {
      scheduledAt?: string;
      status: MessageStatus;
    },
    MutationResponse
  >("createMessage", {
    connectionId,
    contactIds,
    content,
    scheduledAt: scheduledAt?.toISOString(),
    status,
  });

export const updateMessage = ({
  connectionId,
  contactIds,
  content,
  messageId,
  scheduledAt,
  status,
}: UpdateMessageParams) =>
  callFirebaseFunction<
    SaveMessageBaseParams & {
      messageId: string;
      scheduledAt?: string;
      status: MessageStatus;
    },
    MutationResponse
  >("updateMessage", {
    connectionId,
    contactIds,
    content,
    messageId,
    scheduledAt: scheduledAt?.toISOString(),
    status,
  });

export const deleteMessage = (messageId: string) =>
  callFirebaseFunction<{ messageId: string }, MutationResponse>(
    "deleteMessage",
    {
      messageId,
    },
  );
