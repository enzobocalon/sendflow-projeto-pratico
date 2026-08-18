import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import {
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  type CollectionReference,
  type Transaction,
} from "firebase/firestore";
import { docData } from "rxfire/firestore";
import { map } from "rxjs";

import { collectionPaths } from "@/config/collection-paths";
import { BusinessRuleError } from "@/errors/business-rule.error";
import { db } from "@/lib/firebase";

export interface UsageCounters {
  connectionsCount: number;
  contactsCount: number;
  messagesCount: number;
  scheduledMessagesCount: number;
}

export type UsageCounterChanges = Partial<UsageCounters>;

interface UsageDocument extends UsageCounters {
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

const usageCollection = collection(
  db,
  collectionPaths.usage,
) as CollectionReference<UsageDocument, UsageDocument>;

export const emptyUsageCounters: UsageCounters = {
  connectionsCount: 0,
  contactsCount: 0,
  messagesCount: 0,
  scheduledMessagesCount: 0,
};

const getUsageReference = (userId: string) => doc(usageCollection, userId);

const mapUsageCounters = (data: Partial<UsageCounters>): UsageCounters => ({
  connectionsCount: data.connectionsCount ?? 0,
  contactsCount: data.contactsCount ?? 0,
  messagesCount: data.messagesCount ?? 0,
  scheduledMessagesCount: data.scheduledMessagesCount ?? 0,
});

export const getUsage = async (userId: string) => {
  const snapshot = await getDoc(getUsageReference(userId));

  return mapUsageCounters(snapshot.data() ?? {});
};

export const getUsage$ = (userId: string) =>
  docData(getUsageReference(userId)).pipe(
    map((usage) => mapUsageCounters(usage ?? {})),
  );

export const updateUsageInTransaction = async (
  transaction: Transaction,
  userId: string,
  changes: UsageCounterChanges,
) => {
  const usageReference = getUsageReference(userId);
  const usageSnapshot = await transaction.get(usageReference);
  const now = serverTimestamp();
  const currentUsage = mapUsageCounters(usageSnapshot.data() ?? {});
  const nextConnectionsCount =
    currentUsage.connectionsCount + (changes.connectionsCount ?? 0);

  if (nextConnectionsCount > MAX_CONNECTIONS_PER_USER) {
    throw new BusinessRuleError(
      `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`,
    );
  }

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
