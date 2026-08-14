import {
  type CollectionReference,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";

import { db } from "../../firebase";

export interface Usage {
  connectionsCount: number;
  contactsCount: number;
  createdAt: Timestamp;
  messagesCount: number;
  scheduledMessagesCount: number;
  updatedAt: Timestamp;
  userId: string;
}

const usageCollection = db.collection("usage") as CollectionReference<Usage>;

export const updateScheduledMessagesUsageInTransaction = async (
  transaction: Transaction,
  messagesByUser: Map<string, number>,
  updatedAt: Timestamp,
) => {
  const usageEntries = await Promise.all(
    [...messagesByUser].map(async ([userId, count]) => ({
      count,
      snapshot: await transaction.get(usageCollection.doc(userId)),
    })),
  );

  usageEntries.forEach(({ count, snapshot }) => {
    if (!snapshot.exists) return;

    const currentCount = snapshot.data()?.scheduledMessagesCount ?? 0;

    transaction.update(snapshot.ref, {
      scheduledMessagesCount: Math.max(0, currentCount - count),
      updatedAt,
    });
  });
};
