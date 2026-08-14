import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../../firebase";
import { updateScheduledMessagesUsageInTransaction } from "../usage/usage.model";
import {
  getDueScheduledMessagesInTransaction,
  getScheduledMessageCountsByUser,
  updateMessagesAsSentInTransaction,
} from "./message.model";

const DUE_MESSAGES_LIMIT = 250;

export const processDueScheduledMessages = async (
  now: Timestamp = Timestamp.now(),
) => {
  await db.runTransaction(async (transaction) => {
    const snapshot = await getDueScheduledMessagesInTransaction(
      transaction,
      now,
      DUE_MESSAGES_LIMIT,
    );

    if (snapshot.empty) return;

    const messagesByUser = getScheduledMessageCountsByUser(snapshot.docs);

    await updateScheduledMessagesUsageInTransaction(
      transaction,
      messagesByUser,
      now,
    );
    updateMessagesAsSentInTransaction(transaction, snapshot.docs, now);
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
