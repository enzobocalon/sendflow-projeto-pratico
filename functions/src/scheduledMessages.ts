import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "./firebase";

const DUE_MESSAGES_LIMIT = 250;

type MessageDocument = FirebaseFirestore.QueryDocumentSnapshot;

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
  const countByUser = countMessagesByUser(messages);

  messages.forEach((message) => {
    transaction.update(message.ref, {
      sentAt,
      status: "sent",
      updatedAt: sentAt,
    });
  });

  countByUser.forEach((count, userId) => {
    const usageRef = db.collection("usage").doc(userId);
    transaction.set(
      usageRef,
      { scheduledMessagesCount: FieldValue.increment(-count) },
      { merge: true },
    );
  });
};

const countMessagesByUser = (messages: MessageDocument[]) => {
  return messages.reduce<Map<string, number>>((countByUser, message) => {
    const { userId } = message.data();

    if (typeof userId === "string") {
      countByUser.set(userId, (countByUser.get(userId) ?? 0) + 1);
    }

    return countByUser;
  }, new Map<string, number>());
};

export const processDueScheduledMessages = async (
  now: Timestamp = Timestamp.now(),
) => {
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(getDueScheduledMessagesQuery(now));

    if (snapshot.empty) return;

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
