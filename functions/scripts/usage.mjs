import { Timestamp } from "firebase-admin/firestore";

const readCount = async (query) => (await query.count().get()).data().count;

export const synchronizeUsage = async (db, userId) => {
  const connections = db
    .collection("connections")
    .where("userId", "==", userId);
  const contacts = db.collection("contacts").where("userId", "==", userId);
  const messages = db.collection("messages").where("userId", "==", userId);
  const usageRef = db.collection("usage").doc(userId);
  const [
    totalConnections,
    archivedConnections,
    contactsCount,
    messagesCount,
    scheduledMessagesCount,
    usageSnapshot,
  ] = await Promise.all([
    readCount(connections),
    readCount(connections.where("status", "==", "archived")),
    readCount(contacts),
    readCount(messages),
    readCount(messages.where("status", "==", "scheduled")),
    usageRef.get(),
  ]);
  const usage = {
    connectionsCount: totalConnections - archivedConnections,
    contactsCount,
    messagesCount,
    scheduledMessagesCount,
  };
  const now = Timestamp.now();

  await usageRef.set({
    ...usage,
    createdAt: usageSnapshot.data()?.createdAt ?? now,
    updatedAt: now,
    userId,
  });

  return usage;
};
