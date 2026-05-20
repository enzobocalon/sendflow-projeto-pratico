import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "./firebase";

const DUE_MESSAGES_LIMIT = 250;

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
  const countByUser = countMessagesByUser(messages);
  const batch = db.batch();

  messages.forEach((message) => {
    batch.update(message.ref, { sentAt, status: "sent", updatedAt: sentAt });
  });

  countByUser.forEach((count, userId) => {
    const usageRef = db.collection("usage").doc(userId);
    batch.set(
      usageRef,
      { scheduledMessagesCount: FieldValue.increment(-count) },
      { merge: true },
    );
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

export const markScheduledMessagesAsSent = onSchedule(
  {
    region: "southamerica-east1",
    schedule: "* * * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = Timestamp.now();
    const snapshot = await getDueScheduledMessages(now);

    if (snapshot.empty) return;

    await markMessagesAsSent(snapshot.docs, now);
  },
);
