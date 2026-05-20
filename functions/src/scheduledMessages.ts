import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "./firebase";
import { incrementUsage } from "./usage";

const DUE_MESSAGES_LIMIT = 500;

type MessageDocument = FirebaseFirestore.QueryDocumentSnapshot;

const getDueScheduledMessages = (now: Timestamp) => {
  return db
    .collection("messages")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(DUE_MESSAGES_LIMIT)
    .get();
};

const markMessagesAsSent = async (
  messages: MessageDocument[],
  sentAt: Timestamp,
) => {
  const batch = db.batch();

  messages.forEach((message) => {
    batch.update(message.ref, {
      sentAt,
      status: "sent",
      updatedAt: sentAt,
    });
  });

  await batch.commit();
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

const decrementScheduledUsage = async (messages: MessageDocument[]) => {
  const countByUser = countMessagesByUser(messages);

  await Promise.all(
    [...countByUser.entries()].map(([userId, count]) =>
      incrementUsage(userId, { scheduledMessagesCount: -count }),
    ),
  );
};

export const markScheduledMessagesAsSent = onSchedule(
  {
    region: "southamerica-east1",
    schedule: "* * * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = Timestamp.now();
    const snapshot = await getDueScheduledMessages(now);

    if (snapshot.empty) {
      return;
    }

    await markMessagesAsSent(snapshot.docs, now);
    await decrementScheduledUsage(snapshot.docs);
  },
);
