import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { MessageStatus } from "../features/messages/types";

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

const getMessageScheduleFields = (
  status: MessageStatus,
  scheduledAt?: Date,
) => ({
  scheduledAt:
    status === "scheduled" && scheduledAt
      ? Timestamp.fromDate(scheduledAt)
      : null,
  sentAt: status === "sent" ? serverTimestamp() : null,
});

export const createMessage = ({
  connectionId,
  contactIds,
  content,
  scheduledAt,
  status,
  userId,
}: CreateMessageParams) =>
  addDoc(collection(db, "messages"), {
    connectionId,
    contactIds,
    content: content.trim(),
    createdAt: serverTimestamp(),
    recipientsCount: contactIds.length,
    status,
    updatedAt: serverTimestamp(),
    userId,
    ...getMessageScheduleFields(status, scheduledAt),
  });

export const updateMessage = ({
  connectionId,
  contactIds,
  content,
  messageId,
  scheduledAt,
  status,
}: UpdateMessageParams) =>
  updateDoc(doc(db, "messages", messageId), {
    connectionId,
    contactIds,
    content: content.trim(),
    recipientsCount: contactIds.length,
    status,
    updatedAt: serverTimestamp(),
    ...getMessageScheduleFields(status, scheduledAt),
  });

export const deleteMessage = (messageId: string) =>
  deleteDoc(doc(db, "messages", messageId));
