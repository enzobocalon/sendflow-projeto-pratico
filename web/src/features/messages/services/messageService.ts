import {
  MAX_MESSAGE_CONTACTS,
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
  hasUniqueValues,
  isFutureDate,
  isValidMessageContent,
  type MessageStatus,
} from "@sendflow/shared";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  type DocumentData,
  type FieldValue,
  type FirestoreError,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Transaction,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  createFirestoreServiceError,
  requireAuthenticatedUserId,
} from "../../../lib/firestoreService";
import { updateUsageInTransaction } from "../../dashboard/services/usageService";
import { readActiveConnectionInTransaction } from "../../connections/services/connectionService";
import type { Message } from "../types";

type CreateMessageInput = {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledAt?: Date;
  status: MessageStatus;
};

type UpdateMessageInput = CreateMessageInput & {
  messageId: string;
};

type MessageDocument = Omit<Message, "id">;

type CreateMessagesPageQueryParams = {
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  status: MessageStatus | "all";
  userId: string;
};

type MessageScheduleFields = {
  scheduledAt: Timestamp | null;
  sentAt: FieldValue | null;
  status: MessageStatus;
};

const validateMessageFields = (content: string, contactIds: string[]) => {
  if (!isValidMessageContent(content)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      `Informe uma mensagem com ${MESSAGE_CONTENT_MIN_LENGTH} a ${MESSAGE_CONTENT_MAX_LENGTH} caracteres.`,
    );
  }

  if (
    contactIds.length === 0 ||
    contactIds.length > MAX_MESSAGE_CONTACTS ||
    contactIds.some((contactId) => !contactId)
  ) {
    throw createFirestoreServiceError(
      "invalid-argument",
      `Selecione de 1 a ${MAX_MESSAGE_CONTACTS} contatos.`,
    );
  }

  if (!hasUniqueValues(contactIds)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Existem contatos duplicados.",
    );
  }
};

const getMessageScheduleFields = (
  status: MessageStatus,
  scheduledAt?: Date,
): MessageScheduleFields => {
  if (status === "sent") {
    return {
      scheduledAt: null,
      sentAt: serverTimestamp(),
      status,
    };
  }

  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma data de agendamento válida.",
    );
  }

  if (!isFutureDate(scheduledAt)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Agende a mensagem para uma data futura.",
    );
  }

  return {
    scheduledAt: Timestamp.fromDate(scheduledAt),
    sentAt: null,
    status,
  };
};

const validateContactsInTransaction = async (
  transaction: Transaction,
  contactIds: string[],
  connectionId: string,
  userId: string,
) => {
  const snapshots = await Promise.all(
    contactIds.map((contactId) =>
      transaction.get(doc(db, "contacts", contactId)),
    ),
  );
  const allContactsAreValid = snapshots.every((snapshot) => {
    const contact = snapshot.data();

    return (
      snapshot.exists() &&
      contact?.userId === userId &&
      contact.connectionId === connectionId
    );
  });

  if (!allContactsAreValid) {
    throw createFirestoreServiceError(
      "permission-denied",
      "A mensagem possui contatos inválidos.",
    );
  }
};

export const mapMessageDocument = (
  document: QueryDocumentSnapshot<DocumentData>,
): Message => ({
  id: document.id,
  ...(document.data() as MessageDocument),
});

const createMessagesPageQuery = ({
  cursor,
  resultLimit,
  status,
  userId,
}: CreateMessagesPageQueryParams) => {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  ];

  if (status !== "all") {
    constraints.splice(1, 0, where("status", "==", status));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(resultLimit));

  return query(collection(db, "messages"), ...constraints);
};

export const subscribeToMessagesPage = (
  params: CreateMessagesPageQueryParams,
  onValue: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError: (error: FirestoreError) => void,
) =>
  onSnapshot(
    createMessagesPageQuery(params),
    onValue,
    onError,
  );

export const createMessage = async ({
  connectionId: rawConnectionId,
  contactIds: rawContactIds,
  content: rawContent,
  scheduledAt,
  status,
}: CreateMessageInput) => {
  const userId = requireAuthenticatedUserId(
    "Faça login para salvar uma mensagem.",
  );
  const connectionId = rawConnectionId.trim();
  const contactIds = rawContactIds.map((contactId) => contactId.trim());
  const content = rawContent.trim();

  if (!connectionId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  validateMessageFields(content, contactIds);
  const scheduleFields = getMessageScheduleFields(status, scheduledAt);
  const messageRef = doc(collection(db, "messages"));

  await runTransaction(db, async (transaction) => {
    await readActiveConnectionInTransaction(transaction, connectionId, userId);
    await validateContactsInTransaction(
      transaction,
      contactIds,
      connectionId,
      userId,
    );
    await updateUsageInTransaction(transaction, userId, {
      messagesCount: 1,
      ...(status === "scheduled" && { scheduledMessagesCount: 1 }),
    });
    const now = serverTimestamp();

    transaction.set(messageRef, {
      connectionId,
      contactIds,
      content,
      createdAt: now,
      recipientsCount: contactIds.length,
      updatedAt: now,
      userId,
      ...scheduleFields,
    });
  });
};

export const updateMessage = async ({
  connectionId: rawConnectionId,
  contactIds: rawContactIds,
  content: rawContent,
  messageId: rawMessageId,
  scheduledAt,
  status,
}: UpdateMessageInput) => {
  const userId = requireAuthenticatedUserId(
    "Faça login para salvar uma mensagem.",
  );
  const connectionId = rawConnectionId.trim();
  const contactIds = rawContactIds.map((contactId) => contactId.trim());
  const content = rawContent.trim();
  const messageId = rawMessageId.trim();

  if (!messageId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma mensagem válida.",
    );
  }

  if (!connectionId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  validateMessageFields(content, contactIds);
  const scheduleFields = getMessageScheduleFields(status, scheduledAt);

  await runTransaction(db, async (transaction) => {
    const messageRef = doc(db, "messages", messageId);
    const messageSnapshot = await transaction.get(messageRef);

    if (!messageSnapshot.exists() || messageSnapshot.data().userId !== userId) {
      throw createFirestoreServiceError(
        "permission-denied",
        "Mensagem inválida.",
      );
    }

    if (messageSnapshot.data().status === "sent") {
      throw createFirestoreServiceError(
        "failed-precondition",
        "Mensagens enviadas não podem ser editadas.",
      );
    }

    await readActiveConnectionInTransaction(transaction, connectionId, userId);
    await validateContactsInTransaction(
      transaction,
      contactIds,
      connectionId,
      userId,
    );
    if (status === "sent") {
      await updateUsageInTransaction(transaction, userId, {
        scheduledMessagesCount: -1,
      });
    }
    transaction.update(messageRef, {
      connectionId,
      contactIds,
      content,
      recipientsCount: contactIds.length,
      updatedAt: serverTimestamp(),
      ...scheduleFields,
    });
  });
};

export const deleteMessage = async (messageId: string) => {
  const userId = requireAuthenticatedUserId("Faça login para continuar.");
  const normalizedMessageId = messageId.trim();

  if (!normalizedMessageId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma mensagem válida.",
    );
  }

  await runTransaction(db, async (transaction) => {
    const messageRef = doc(db, "messages", normalizedMessageId);
    const messageSnapshot = await transaction.get(messageRef);

    if (!messageSnapshot.exists() || messageSnapshot.data().userId !== userId) {
      throw createFirestoreServiceError(
        "permission-denied",
        "Mensagem inválida.",
      );
    }

    const isScheduled = messageSnapshot.data().status === "scheduled";

    await updateUsageInTransaction(transaction, userId, {
      messagesCount: -1,
      ...(isScheduled && { scheduledMessagesCount: -1 }),
    });
    transaction.delete(messageRef);
  });
};
