import type { MessageStatus } from "@sendflow/shared";
import {
  collection,
  doc,
  getDocs,
  limit,
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
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Transaction,
} from "firebase/firestore";
import { collection as collection$ } from "rxfire/firestore";

import { collectionPaths } from "@/config/collection-paths";
import { BusinessRuleError } from "@/errors/business-rule.error";
import { getAreContactsValidForConnection } from "@/features/contacts/contacts.model";
import { updateUsageInTransaction } from "@/features/usage/usage.model";
import { db } from "@/lib/firebase";
import { requireAuthenticatedUserId } from "@/lib/firestore";

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

interface MessageInput {
  connectionId: string;
  contactIds: string[];
  content: string;
}

interface ScheduledMessageInput extends MessageInput {
  scheduledAt: Date;
  status: "scheduled";
}

interface SentMessageInput extends MessageInput {
  scheduledAt?: never;
  status: "sent";
}

type CreateMessageInput = ScheduledMessageInput | SentMessageInput;

type UpdateMessageInput = CreateMessageInput & {
  messageId: string;
};

type MessageDocument = Omit<Message, "id">;

interface GetMessagesPageParams {
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  status: MessageStatus | "all";
}

const messagesCollection = collection(
  db,
  collectionPaths.messages,
) as CollectionReference<MessageDocument, MessageDocument>;

const getMessageScheduleFields = (params: CreateMessageInput) => {
  const { status } = params;

  if (status === "sent") {
    return {
      scheduledAt: null,
      sentAt: serverTimestamp(),
      status,
    };
  }

  return {
    scheduledAt: Timestamp.fromDate(params.scheduledAt),
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
  const contactsAreValid = await getAreContactsValidForConnection(
    transaction,
    contactIds,
    connectionId,
    userId,
  );

  if (!contactsAreValid) {
    throw new BusinessRuleError("A mensagem possui contatos inválidos.");
  }
};

export const mapMessageDocument = (
  document: DocumentSnapshot<DocumentData>,
): Message => ({
  id: document.id,
  ...(document.data() as MessageDocument),
});

const createMessagesPageQuery = (
  params: GetMessagesPageParams,
  userId: string,
) => {
  const { cursor, resultLimit, status } = params;
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (status !== "all") constraints.push(where("status", "==", status));

  constraints.push(orderBy("createdAt", "desc"));

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(resultLimit));

  return query(messagesCollection, ...constraints);
};

export const getMessagesPage$ = (params: GetMessagesPageParams) => {
  const userId = requireAuthenticatedUserId();

  return collection$(createMessagesPageQuery(params, userId));
};

export const getHasMessagesByConnection = async (
  connectionId: string,
  userId: string,
) => {
  const snapshot = await getDocs(
    query(
      messagesCollection,
      where("userId", "==", userId),
      where("connectionId", "==", connectionId),
      limit(1),
    ),
  );

  return !snapshot.empty;
};

export const createMessage = async (params: CreateMessageInput) => {
  const {
    connectionId: rawConnectionId,
    contactIds: rawContactIds,
    content: rawContent,
    status,
  } = params;
  const userId = requireAuthenticatedUserId();
  const connectionId = rawConnectionId.trim();
  const contactIds = rawContactIds.map((contactId) => contactId.trim());
  const content = rawContent.trim();

  const scheduleFields = getMessageScheduleFields(params);
  const messageRef = doc(messagesCollection);

  await runTransaction(db, async (transaction) => {
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
    status,
  } = params;
  const userId = requireAuthenticatedUserId();
  const connectionId = rawConnectionId.trim();
  const contactIds = rawContactIds.map((contactId) => contactId.trim());
  const content = rawContent.trim();
  const messageId = rawMessageId.trim();

  const scheduleFields = getMessageScheduleFields(params);

  await runTransaction(db, async (transaction) => {
    const messageRef = doc(messagesCollection, messageId);
    const messageSnapshot = await transaction.get(messageRef);

    if (!messageSnapshot.exists() || messageSnapshot.data().userId !== userId) {
      throw new Error("Mensagem inválida.");
    }

    if (messageSnapshot.data().status === "sent") {
      throw new BusinessRuleError("Mensagens enviadas não podem ser editadas.");
    }

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
  const userId = requireAuthenticatedUserId();
  const normalizedMessageId = messageId.trim();

  await runTransaction(db, async (transaction) => {
    const messageRef = doc(messagesCollection, normalizedMessageId);
    const messageSnapshot = await transaction.get(messageRef);

    if (!messageSnapshot.exists()) return;

    if (messageSnapshot.data().userId !== userId) {
      throw new Error("Mensagem inválida.");
    }

    const isScheduled = messageSnapshot.data().status === "scheduled";

    await updateUsageInTransaction(transaction, userId, {
      messagesCount: -1,
      ...(isScheduled && { scheduledMessagesCount: -1 }),
    });
    transaction.delete(messageRef);
  });
};
