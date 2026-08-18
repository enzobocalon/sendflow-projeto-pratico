import { normalizePhone, normalizeSearchText } from "@sendflow/shared";
import {
  collection,
  deleteField,
  doc,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type FieldValue,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Transaction,
  type UpdateData,
} from "firebase/firestore";
import { collection as collection$ } from "rxfire/firestore";

import { collectionPaths } from "@/config/collection-paths";
import { updateUsageInTransaction } from "@/features/usage/usage.model";
import { db } from "@/lib/firebase";
import { requireAuthenticatedUserId } from "@/lib/firestore";

export interface Contact {
  connectionId: string;
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  phone: string;
  updatedAt?: Timestamp;
  userId: string;
}

type ContactDocument = Omit<Contact, "id">;

interface CreateContactInput {
  connectionId: Contact["connectionId"];
  name: Contact["name"];
  phone: Contact["phone"];
}

interface UpdateContactInput extends CreateContactInput {
  contactId: string;
}

interface GetContactsPageParams {
  connectionId?: string;
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  searchTerm: string;
}

const contactsCollection = collection(
  db,
  collectionPaths.contacts,
) as CollectionReference<ContactDocument, ContactDocument>;

export const mapContactDocument = (
  document: DocumentSnapshot<DocumentData>,
): Contact => ({
  id: document.id,
  ...(document.data() as ContactDocument),
});

const createContactsPageQuery = (
  params: GetContactsPageParams,
  userId: string,
) => {
  const { connectionId, cursor, resultLimit, searchTerm } = params;
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (connectionId) {
    constraints.push(where("connectionId", "==", connectionId));
  }

  constraints.push(
    orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
  );

  if (normalizedSearchTerm) {
    if (!cursor) constraints.push(startAt(normalizedSearchTerm));
    constraints.push(endAt(`${normalizedSearchTerm}\uf8ff`));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(resultLimit));

  return query(contactsCollection, ...constraints);
};

export const getContactsPage$ = (params: GetContactsPageParams) => {
  const userId = requireAuthenticatedUserId();

  return collection$(createContactsPageQuery(params, userId));
};

export const getHasContactsByConnection = async (
  connectionId: string,
  userId: string,
) => {
  const snapshot = await getDocs(
    query(
      contactsCollection,
      where("userId", "==", userId),
      where("connectionId", "==", connectionId),
      limit(1),
    ),
  );

  return !snapshot.empty;
};

export const getAreContactsValidForConnection = async (
  transaction: Transaction,
  contactIds: string[],
  connectionId: string,
  userId: string,
) => {
  const snapshots = await Promise.all(
    contactIds.map((contactId) =>
      transaction.get(doc(contactsCollection, contactId)),
    ),
  );

  return snapshots.every((snapshot) => {
    const contact = snapshot.data();

    return (
      snapshot.exists() &&
      contact?.userId === userId &&
      contact.connectionId === connectionId
    );
  });
};

export const createContact = async (params: CreateContactInput) => {
  const {
    connectionId: rawConnectionId,
    name: rawName,
    phone: rawPhone,
  } = params;
  const userId = requireAuthenticatedUserId();
  const connectionId = rawConnectionId.trim();
  const name = rawName.trim();
  const phone = normalizePhone(rawPhone.trim());

  const contactRef = doc(contactsCollection);

  await runTransaction(db, async (transaction) => {
    await updateUsageInTransaction(transaction, userId, { contactsCount: 1 });
    const now = serverTimestamp();

    transaction.set(contactRef, {
      connectionId,
      createdAt: now,
      name,
      nameNormalized: normalizeSearchText(name),
      phone,
      updatedAt: now,
      userId,
    });
  });
};

export const upsertContact = async (params: UpdateContactInput) => {
  const {
    connectionId: rawConnectionId,
    contactId: rawContactId,
    name: rawName,
    phone: rawPhone,
  } = params;
  requireAuthenticatedUserId();
  const connectionId = rawConnectionId.trim();
  const contactId = rawContactId.trim();
  const name = rawName.trim();
  const phone = normalizePhone(rawPhone.trim());

  const updates: UpdateData<ContactDocument> & {
    connectionName: FieldValue;
  } = {
    connectionId,
    connectionName: deleteField(),
    name,
    nameNormalized: normalizeSearchText(name),
    phone,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(contactsCollection, contactId), updates);
};

export const deleteContact = async (contactId: string) => {
  const userId = requireAuthenticatedUserId();
  const normalizedContactId = contactId.trim();

  await runTransaction(db, async (transaction) => {
    const contactRef = doc(contactsCollection, normalizedContactId);
    const contactSnapshot = await transaction.get(contactRef);

    if (!contactSnapshot.exists()) return;

    if (contactSnapshot.data().userId !== userId) {
      throw new Error("Contato inválido.");
    }

    await updateUsageInTransaction(transaction, userId, {
      contactsCount: -1,
    });
    transaction.delete(contactRef);
  });
};
