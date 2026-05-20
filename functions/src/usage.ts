import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";

type UsageDelta = Partial<{
  connectionsCount: number;
  contactsCount: number;
  messagesCount: number;
  scheduledMessagesCount: number;
}>;

export const incrementUsage = async (userId: string, delta: UsageDelta) => {
  const fields = Object.fromEntries(
    Object.entries(delta)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => [key, FieldValue.increment(value!)]),
  );

  if (Object.keys(fields).length === 0) return;

  await db
    .collection("usage")
    .doc(userId)
    .set(
      { ...fields, updatedAt: FieldValue.serverTimestamp(), userId },
      { merge: true },
    );
};
