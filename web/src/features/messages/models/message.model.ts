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
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type FieldValue,
  type FirestoreError,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Transaction,
} from "firebase/firestore";

import { getActiveConnectionInTransaction } from "@/features/connections/models/connection.model";
import { db } from "@/lib/firebase";
import {
  createFirestoreServiceError,
  requireAuthenticatedUserId,
} from "@/lib/firestore-service";
import { collectionPaths } from "@/models/collection-paths";
import { updateUsageInTransaction } from "@/models/usage.model";

export interface Message {
  connectionId: string;
  contactIds: string[];
  content: string;
  createdAt?: Timestamp;
  id: string;
  recipientsCount: number;
  scheduledAt?: Timestamp | null;
  sentAt?: Timestamp | null;
  status: MessageStatus;
  updatedAt?: Timestamp;
  userId: string;
}

interface CreateMessageInput {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledAt?: Date;
  status: MessageStatus;
}

interface UpdateMessageInput extends CreateMessageInput {
  messageId: string;
}

type MessageDocument = Omit<Message, "id">;

const messagesCollection = collection(
  db,
  collectionPaths.messages,
) as CollectionReference<MessageDocument, MessageDocument>;

interface GetMessagesPageRealtimeParams {
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  status: MessageStatus | "all";
  userId: string;
}

interface MessageScheduleFields {
  scheduledAt: Timestamp | null;
  sentAt: FieldValue | null;
  status: MessageStatus;
}

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
      transaction.get(doc(collection(db, collectionPaths.contacts), contactId)),
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
  document: DocumentSnapshot<DocumentData>,
): Message => ({
  id: document.id,
  ...(document.data() as MessageDocument),
});

export const getMessage = async (messageId: string, userId: string) => {
  const snapshot = await getDoc(doc(messagesCollection, messageId));
  const message = snapshot.data();

  if (!snapshot.exists() || message?.userId !== userId) {
    throw createFirestoreServiceError(
      "permission-denied",
      "Mensagem inválida.",
    );
  }

  return mapMessageDocument(snapshot);
};

const createMessagesPageQuery = (params: GetMessagesPageRealtimeParams) => {
  const { cursor, resultLimit, status, userId } = params;
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  ];

  if (status !== "all") {
    constraints.splice(1, 0, where("status", "==", status));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(resultLimit));

  return query(messagesCollection, ...constraints);
};

export const getMessagesPageRealtime = (
  params: GetMessagesPageRealtimeParams,
  onValue: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError: (error: FirestoreError) => void,
) => onSnapshot(createMessagesPageQuery(params), onValue, onError);

export const createMessage = async (params: CreateMessageInput) => {
  const {
    connectionId: rawConnectionId,
    contactIds: rawContactIds,
    content: rawContent,
    scheduledAt,
    status,
  } = params;
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
  const messageRef = doc(messagesCollection);

  await runTransaction(db, async (transaction) => {
    await getActiveConnectionInTransaction(transaction, connectionId, userId);
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

export const upsertMessage = async (params: UpdateMessageInput) => {
  const {
    connectionId: rawConnectionId,
    contactIds: rawContactIds,
    content: rawContent,
    messageId: rawMessageId,
    scheduledAt,
    status,
  } = params;
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
    const messageRef = doc(messagesCollection, messageId);
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

    await getActiveConnectionInTransaction(transaction, connectionId, userId);
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
    const messageRef = doc(messagesCollection, normalizedMessageId);
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
