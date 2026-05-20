import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  getAuthenticatedUserId,
  getMessageScheduleFields,
  getOwnedConnection,
  getStringField,
  validateContactIds,
} from "./utils";

export const createMessage = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const connectionId = getStringField(request.data?.connectionId);
    const content = getStringField(request.data?.content);

    if (content.length < 2 || content.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "Informe uma mensagem com 2 a 500 caracteres.",
      );
    }

    await getOwnedConnection(connectionId, userId);
    const contactIds = await validateContactIds({
      connectionId,
      contactIds: request.data?.contactIds,
      userId,
    });
    const scheduleFields = getMessageScheduleFields(
      request.data?.status,
      request.data?.scheduledAt,
    );

    const isScheduled = scheduleFields.status === "scheduled";
    const now = FieldValue.serverTimestamp();
    const messageRef = db.collection("messages").doc();
    const usageRef = db.collection("usage").doc(userId);

    const batch = db.batch();
    batch.set(messageRef, {
      connectionId,
      contactIds,
      content,
      createdAt: now,
      recipientsCount: contactIds.length,
      updatedAt: now,
      userId,
      ...scheduleFields,
    });

    batch.set(
      usageRef,
      {
        messagesCount: FieldValue.increment(1),
        ...(isScheduled && { scheduledMessagesCount: FieldValue.increment(1) }),
      },
      { merge: true },
    );
    await batch.commit();

    return { id: messageRef.id };
  },
);

export const updateMessage = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const messageId = getStringField(request.data?.messageId);
    const connectionId = getStringField(request.data?.connectionId);
    const content = getStringField(request.data?.content);

    if (content.length < 2 || content.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "Informe uma mensagem com 2 a 500 caracteres.",
      );
    }

    await getOwnedConnection(connectionId, userId);
    const contactIds = await validateContactIds({
      connectionId,
      contactIds: request.data?.contactIds,
      userId,
    });
    const scheduleFields = getMessageScheduleFields(
      request.data?.status,
      request.data?.scheduledAt,
    );

    const messageRef = db.collection("messages").doc(messageId);
    const usageRef = db.collection("usage").doc(userId);

    await db.runTransaction(async (transaction) => {
      const messageSnapshot = await transaction.get(messageRef);

      if (
        !messageSnapshot.exists ||
        messageSnapshot.data()?.userId !== userId
      ) {
        throw new HttpsError("permission-denied", "Mensagem inválida.");
      }

      if (messageSnapshot.data()?.status === "sent") {
        throw new HttpsError(
          "failed-precondition",
          "Mensagens enviadas não podem ser editadas.",
        );
      }

      const wasScheduled = messageSnapshot.data()?.status === "scheduled";
      const becameSent = wasScheduled && scheduleFields.status === "sent";

      transaction.update(messageRef, {
        connectionId,
        contactIds,
        content,
        recipientsCount: contactIds.length,
        updatedAt: FieldValue.serverTimestamp(),
        ...scheduleFields,
      });

      if (becameSent) {
        transaction.set(
          usageRef,
          { scheduledMessagesCount: FieldValue.increment(-1) },
          { merge: true },
        );
      }
    });

    return { id: messageId };
  },
);

export const deleteMessage = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const messageId = getStringField(request.data?.messageId);
    const messageRef = db.collection("messages").doc(messageId);
    const messageSnapshot = await messageRef.get();

    if (!messageSnapshot.exists || messageSnapshot.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "Mensagem inválida.");
    }

    const isScheduled = messageSnapshot.data()?.status === "scheduled";
    const usageRef = db.collection("usage").doc(userId);

    const batch = db.batch();
    batch.delete(messageRef);
    batch.set(
      usageRef,
      {
        messagesCount: FieldValue.increment(-1),
        ...(isScheduled && {
          scheduledMessagesCount: FieldValue.increment(-1),
        }),
      },
      { merge: true },
    );
    await batch.commit();

    return { id: messageId };
  },
);
