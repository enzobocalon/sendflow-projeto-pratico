import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "./firebase";

export const MAX_CONNECTIONS_PER_USER = 100;
export const MAX_MESSAGE_CONTACTS = 100;

type MessageStatus = "sent" | "scheduled";

export const normalizeSearchText = (value: string) => value.trim().toLowerCase();

export const sanitizePhone = (value: string) => value.replace(/\D/g, "");

export const getAuthenticatedUserId = (userId?: string) => {
  if (!userId) {
    throw new HttpsError("unauthenticated", "Faça login para continuar.");
  }

  return userId;
};

export const getStringField = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getOwnedConnection = async (
  connectionId: string,
  userId: string,
) => {
  const connection = await db.collection("connections").doc(connectionId).get();

  if (!connection.exists || connection.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Conexão inválida.");
  }

  return {
    id: connection.id,
    name: String(connection.data()?.name ?? ""),
  };
};

export const validateContactIds = async ({
  connectionId,
  contactIds,
  userId,
}: {
  connectionId: string;
  contactIds: unknown;
  userId: string;
}) => {
  if (
    !Array.isArray(contactIds) ||
    contactIds.length === 0 ||
    contactIds.length > MAX_MESSAGE_CONTACTS ||
    !contactIds.every((contactId) => typeof contactId === "string")
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Selecione de 1 a ${MAX_MESSAGE_CONTACTS} contatos.`,
    );
  }

  const uniqueContactIds = [...new Set(contactIds)] as string[];

  if (uniqueContactIds.length !== contactIds.length) {
    throw new HttpsError("invalid-argument", "Existem contatos duplicados.");
  }

  const contactRefs = uniqueContactIds.map((contactId) =>
    db.collection("contacts").doc(contactId),
  );
  const contactSnapshots = await db.getAll(...contactRefs);

  const allContactsAreValid = contactSnapshots.every((snapshot) => {
    const contact = snapshot.data();

    return (
      snapshot.exists &&
      contact?.userId === userId &&
      contact?.connectionId === connectionId
    );
  });

  if (!allContactsAreValid) {
    throw new HttpsError(
      "permission-denied",
      "A mensagem possui contatos inválidos.",
    );
  }

  return uniqueContactIds;
};

export const getMessageScheduleFields = (
  status: unknown,
  scheduledAt: unknown,
): {
  scheduledAt: Timestamp | null;
  sentAt: FieldValue | null;
  status: MessageStatus;
} => {
  if (status !== "sent" && status !== "scheduled") {
    throw new HttpsError("invalid-argument", "Status de mensagem inválido.");
  }

  if (status === "sent") {
    return {
      scheduledAt: null,
      sentAt: FieldValue.serverTimestamp(),
      status,
    };
  }

  const scheduledDate =
    typeof scheduledAt === "string" || typeof scheduledAt === "number"
      ? new Date(scheduledAt)
      : null;

  if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
    throw new HttpsError(
      "invalid-argument",
      "Informe uma data de agendamento válida.",
    );
  }

  if (scheduledDate <= new Date()) {
    throw new HttpsError(
      "invalid-argument",
      "Agende a mensagem para uma data futura.",
    );
  }

  return {
    scheduledAt: Timestamp.fromDate(scheduledDate),
    sentAt: null,
    status,
  };
};
