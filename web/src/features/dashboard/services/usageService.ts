import {
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  type FirestoreError,
  type Transaction,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

export type UsageCounters = {
  connectionsCount: number;
  contactsCount: number;
  messagesCount: number;
  scheduledMessagesCount: number;
};

export type UsageCounterChanges = Partial<UsageCounters>;

export const emptyUsageCounters: UsageCounters = {
  connectionsCount: 0,
  contactsCount: 0,
  messagesCount: 0,
  scheduledMessagesCount: 0,
};

const getUsageReference = (userId: string) => doc(db, "usage", userId);

const mapUsageCounters = (data: Partial<UsageCounters>): UsageCounters => ({
  connectionsCount: data.connectionsCount ?? 0,
  contactsCount: data.contactsCount ?? 0,
  messagesCount: data.messagesCount ?? 0,
  scheduledMessagesCount: data.scheduledMessagesCount ?? 0,
});

export const subscribeToUsage = (
  userId: string,
  onValue: (usage: UsageCounters) => void,
  onError: (error: FirestoreError) => void,
) =>
  onSnapshot(
    getUsageReference(userId),
    (snapshot) => onValue(mapUsageCounters(snapshot.data() ?? {})),
    onError,
  );

export const updateUsageInTransaction = async (
  transaction: Transaction,
  userId: string,
  changes: UsageCounterChanges,
) => {
  const usageReference = getUsageReference(userId);
  const usageSnapshot = await transaction.get(usageReference);
  const now = serverTimestamp();

  if (!usageSnapshot.exists()) {
    const initialUsage: UsageCounters = {
      connectionsCount: changes.connectionsCount ?? 0,
      contactsCount: changes.contactsCount ?? 0,
      messagesCount: changes.messagesCount ?? 0,
      scheduledMessagesCount: changes.scheduledMessagesCount ?? 0,
    };

    transaction.set(usageReference, {
      ...initialUsage,
      createdAt: now,
      updatedAt: now,
      userId,
    });
    return;
  }

  const counterUpdates = Object.fromEntries(
    Object.entries(changes).map(([field, value]) => [field, increment(value)]),
  );

  transaction.update(usageReference, {
    ...counterUpdates,
    updatedAt: now,
  });
};
