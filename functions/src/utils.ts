import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  MAX_MESSAGE_CONTACTS,
  hasUniqueValues,
  isFutureDate,
  isMessageStatus,
  isRequiredString,
  parseDate,
  type MessageStatus,
} from "@sendflow/shared";

export {
  MAX_CONNECTIONS_PER_USER,
  MAX_MESSAGE_CONTACTS,
  normalizeSearchText,
  sanitizePhone,
} from "@sendflow/shared";

export const getAuthenticatedUserId = (userId?: string) => {
  if (!userId) {
    throw new HttpsError("unauthenticated", "Faça login para continuar.");
  }

  return userId;
};

export const getStringField = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getRequiredStringField = (
  value: unknown,
  errorMessage: string,
) => {
  if (!isRequiredString(value)) {
    throw new HttpsError("invalid-argument", errorMessage);
  }

  return value.trim();
};

export const getOwnedConnection = async (
  connectionId: string,
  userId: string,
  transaction?: Transaction,
) => {
  const connectionRef = db.collection("connections").doc(connectionId);
  const connection = transaction
    ? await transaction.get(connectionRef)
    : await connectionRef.get();

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
  transaction,
  userId,
}: {
  connectionId: string;
  contactIds: unknown;
  transaction?: Transaction;
  userId: string;
}) => {
  if (
    !Array.isArray(contactIds) ||
    contactIds.length === 0 ||
    contactIds.length > MAX_MESSAGE_CONTACTS ||
    !contactIds.every(isRequiredString)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Selecione de 1 a ${MAX_MESSAGE_CONTACTS} contatos.`,
    );
  }

  const normalizedContactIds = contactIds.map((contactId) => contactId.trim());

  if (!hasUniqueValues(normalizedContactIds)) {
    throw new HttpsError("invalid-argument", "Existem contatos duplicados.");
  }

  const contactRefs = normalizedContactIds.map((contactId) =>
    db.collection("contacts").doc(contactId),
  );
  const contactSnapshots = transaction
    ? await transaction.getAll(...contactRefs)
    : await db.getAll(...contactRefs);

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

  return normalizedContactIds;
};

export const getMessageScheduleFields = (
  status: unknown,
  scheduledAt: unknown,
): {
  scheduledAt: Timestamp | null;
  sentAt: FieldValue | null;
  status: MessageStatus;
} => {
  if (!isMessageStatus(status)) {
    throw new HttpsError("invalid-argument", "Status de mensagem inválido.");
  }

  if (status === "sent") {
    return {
      scheduledAt: null,
      sentAt: FieldValue.serverTimestamp(),
      status,
    };
  }

  const scheduledDate = parseDate(scheduledAt);

  if (!scheduledDate) {
    throw new HttpsError(
      "invalid-argument",
      "Informe uma data de agendamento válida.",
    );
  }

  if (!isFutureDate(scheduledDate)) {
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
