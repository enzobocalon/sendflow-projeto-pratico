import { normalizePhone, normalizeSearchText } from "@sendflow/shared";
import {
  collection,
  deleteField,
  doc,
  endAt,
  getDoc,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  updateDoc,
  where,
  limit,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Timestamp,
} from "firebase/firestore";

import { collectionPaths } from "@/config/collection-paths";
import { db } from "@/lib/firebase";
import {
  createFirestoreError,
  requireAuthenticatedUserId,
} from "@/lib/firestore";
import { updateUsageInTransaction } from "@/models/usage.model";

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

interface ContactDocument extends Omit<Contact, "id"> {
  connectionName?: string;
}

const contactsCollection = collection(
  db,
  collectionPaths.contacts,
) as CollectionReference<ContactDocument, ContactDocument>;

interface CreateContactInput {
  connectionId: Contact["connectionId"];
  name: Contact["name"];
  phone: Contact["phone"];
}

interface UpdateContactInput extends CreateContactInput {
  contactId: string;
}

interface GetContactsPageRealtimeParams {
  connectionId?: string;
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  searchTerm: string;
  userId: string;
}

export const mapContactDocument = (
  document: DocumentSnapshot<DocumentData>,
): Contact => ({
  id: document.id,
  ...(document.data() as ContactDocument),
});

export const getContact = async (contactId: string, userId: string) => {
  const snapshot = await getDoc(doc(contactsCollection, contactId));
  const contact = snapshot.data();

  if (!snapshot.exists() || contact?.userId !== userId) {
    throw createFirestoreError("permission-denied", "Contato inválido.");
  }

  return mapContactDocument(snapshot);
};

const createContactsPageQuery = (params: GetContactsPageRealtimeParams) => {
  const { connectionId, cursor, resultLimit, searchTerm, userId } = params;
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
  ];

  if (connectionId) {
    constraints.splice(1, 0, where("connectionId", "==", connectionId));
  }

  if (normalizedSearchTerm) {
    if (!cursor) constraints.push(startAt(normalizedSearchTerm));
    constraints.push(endAt(`${normalizedSearchTerm}\uf8ff`));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(resultLimit));

  return query(contactsCollection, ...constraints);
};

export const getContactsPageRealtime = (
  params: GetContactsPageRealtimeParams,
  onValue: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError: (error: FirestoreError) => void,
) => onSnapshot(createContactsPageQuery(params), onValue, onError);

export const createContact = async (params: CreateContactInput) => {
  const {
    connectionId: rawConnectionId,
    name: rawName,
    phone: rawPhone,
  } = params;
  const userId = requireAuthenticatedUserId(
    "Faça login para salvar um contato.",
  );
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
  requireAuthenticatedUserId("Faça login para salvar um contato.");
  const connectionId = rawConnectionId.trim();
  const contactId = rawContactId.trim();
  const name = rawName.trim();
  const phone = normalizePhone(rawPhone.trim());

  await updateDoc(doc(contactsCollection, contactId), {
    connectionId,
    connectionName: deleteField(),
    name,
    nameNormalized: normalizeSearchText(name),
    phone,
    updatedAt: serverTimestamp(),
  });
};

export const deleteContact = async (contactId: string) => {
  const userId = requireAuthenticatedUserId("Faça login para continuar.");
  const normalizedContactId = contactId.trim();

  await runTransaction(db, async (transaction) => {
    const contactRef = doc(contactsCollection, normalizedContactId);
    const contactSnapshot = await transaction.get(contactRef);

    if (!contactSnapshot.exists()) return;

    if (contactSnapshot.data().userId !== userId) {
      throw createFirestoreError("permission-denied", "Contato inválido.");
    }

    await updateUsageInTransaction(transaction, userId, {
      contactsCount: -1,
    });
    transaction.delete(contactRef);
  });
};
