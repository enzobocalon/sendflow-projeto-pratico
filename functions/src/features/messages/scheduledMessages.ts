import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../../firebase";

const DUE_MESSAGES_LIMIT = 250;

type MessageDocument = FirebaseFirestore.QueryDocumentSnapshot;

type ScheduledMessagesByUser = Map<string, number>;

const getDueScheduledMessagesQuery = (now: Timestamp) =>
  db
    .collection("messages")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(DUE_MESSAGES_LIMIT);

const markMessagesAsSent = (
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

const countScheduledMessagesByUser = (messages: MessageDocument[]) =>
  messages.reduce<ScheduledMessagesByUser>((counts, message) => {
    const userId = message.data().userId;

    if (typeof userId === "string" && userId) {
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    }

    return counts;
  }, new Map());

const updateUsageCounters = async (
  transaction: Transaction,
  messages: MessageDocument[],
  updatedAt: Timestamp,
) => {
  const messagesByUser = countScheduledMessagesByUser(messages);
  const usageEntries = await Promise.all(
    [...messagesByUser].map(async ([userId, count]) => ({
      count,
      snapshot: await transaction.get(db.collection("usage").doc(userId)),
    })),
  );

  usageEntries.forEach(({ count, snapshot }) => {
    if (!snapshot.exists) return;

    const currentCount = Number(snapshot.data()?.scheduledMessagesCount ?? 0);

    transaction.update(snapshot.ref, {
      scheduledMessagesCount: Math.max(0, currentCount - count),
      updatedAt,
    });
  });
};

export const processDueScheduledMessages = async (
  now: Timestamp = Timestamp.now(),
) => {
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(getDueScheduledMessagesQuery(now));

    if (snapshot.empty) return;

    await updateUsageCounters(transaction, snapshot.docs, now);
    markMessagesAsSent(transaction, snapshot.docs, now);
  });
};

export const markScheduledMessagesAsSent = onSchedule(
  {
    region: "southamerica-east1",
    schedule: "* * * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    await processDueScheduledMessages();
  },
);
