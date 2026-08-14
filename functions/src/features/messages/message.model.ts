import {
  type CollectionReference,
  type QueryDocumentSnapshot,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";

import { db } from "../../firebase";

export interface Message {
  connectionId: string;
  contactIds: string[];
  content: string;
  createdAt: Timestamp;
  recipientsCount: number;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  status: "scheduled" | "sent";
  updatedAt: Timestamp;
  userId: string;
}

export type MessageDocument = QueryDocumentSnapshot<Message>;

const messagesCollection = db.collection(
  "messages",
) as CollectionReference<Message>;

export const getDueScheduledMessagesInTransaction = (
  transaction: Transaction,
  now: Timestamp,
  resultLimit: number,
) =>
  transaction.get(
    messagesCollection
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(resultLimit),
  );

export const getScheduledMessageCountsByUser = (messages: MessageDocument[]) =>
  messages.reduce<Map<string, number>>((counts, message) => {
    const { userId } = message.data();

    if (userId) {
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    }

    return counts;
  }, new Map());

export const updateMessagesAsSentInTransaction = (
  transaction: Transaction,
  messages: MessageDocument[],
  sentAt: Timestamp,
) => {
  messages.forEach((message) => {
    transaction.update(message.ref, {
      sentAt,
      status: "sent",
      updatedAt: sentAt,
    });
  });
};
