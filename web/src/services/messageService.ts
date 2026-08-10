import type {
  CreateMessageRequest,
  DeleteMessageRequest,
  MutationResponse,
  UpdateMessageRequest,
} from "@sendflow/shared";
import { callFirebaseFunction } from "./firebase-callable";

type CreateMessageParams = Omit<CreateMessageRequest, "scheduledAt"> & {
  scheduledAt?: Date;
};

type UpdateMessageParams = Omit<UpdateMessageRequest, "scheduledAt"> & {
  scheduledAt?: Date;
};

export const createMessage = ({
  connectionId,
  contactIds,
  content,
  scheduledAt,
  status,
}: CreateMessageParams) =>
  callFirebaseFunction<CreateMessageRequest, MutationResponse>(
    "createMessage",
    {
      connectionId,
      contactIds,
      content,
      scheduledAt: scheduledAt?.toISOString(),
      status,
    },
  );

export const updateMessage = ({
  connectionId,
  contactIds,
  content,
  messageId,
  scheduledAt,
  status,
}: UpdateMessageParams) =>
  callFirebaseFunction<UpdateMessageRequest, MutationResponse>(
    "updateMessage",
    {
      connectionId,
      contactIds,
      content,
      messageId,
      scheduledAt: scheduledAt?.toISOString(),
      status,
    },
  );

export const deleteMessage = (messageId: string) =>
  callFirebaseFunction<DeleteMessageRequest, MutationResponse>(
    "deleteMessage",
    {
      messageId,
    },
  );
