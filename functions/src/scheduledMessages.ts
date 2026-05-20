import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "./firebase";

export const markScheduledMessagesAsSent = onSchedule(
  {
    region: "southamerica-east1",
    schedule: "* * * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = Timestamp.now();
    const snapshot = await db
      .collection("messages")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();

    snapshot.docs.forEach((message) => {
      batch.update(message.ref, {
        sentAt: now,
        status: "sent",
        updatedAt: now,
      });
    });

    await batch.commit();
  },
);
