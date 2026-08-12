import {
  NAME_LENGTH_ERROR_MESSAGE,
  isValidName,
  isValidPhone,
  normalizePhone,
  normalizeSearchText,
} from "@sendflow/shared";
import {
  collection,
  deleteField,
  doc,
  endAt,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  where,
  limit,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  createFirestoreServiceError,
  requireAuthenticatedUserId,
} from "../../../lib/firestoreService";
import { updateUsageInTransaction } from "../../dashboard/services/usageService";
import { readActiveConnectionInTransaction } from "../../connections/services/connectionService";
import type { Contact } from "../types";

type ContactDocument = Omit<Contact, "id">;

type CreateContactInput = Pick<Contact, "connectionId" | "name" | "phone">;

type UpdateContactInput = CreateContactInput & {
  contactId: string;
};

type CreateContactsPageQueryParams = {
  connectionId?: string;
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  resultLimit: number;
  searchTerm: string;
  userId: string;
};

const validateContactFields = (name: string, phone: string) => {
  if (!isValidName(name)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      NAME_LENGTH_ERROR_MESSAGE,
    );
  }

  if (!isValidPhone(phone)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe um telefone válido.",
    );
  }
};

export const mapContactDocument = (
  document: QueryDocumentSnapshot<DocumentData>,
): Contact => ({
  id: document.id,
  ...(document.data() as ContactDocument),
});

const createContactsPageQuery = ({
  connectionId,
  cursor,
  resultLimit,
  searchTerm,
  userId,
}: CreateContactsPageQueryParams) => {
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

  return query(collection(db, "contacts"), ...constraints);
};

export const subscribeToContactsPage = (
  params: CreateContactsPageQueryParams,
  onValue: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError: (error: FirestoreError) => void,
) =>
  onSnapshot(
    createContactsPageQuery(params),
    onValue,
    onError,
  );

export const createContact = async ({
  connectionId: rawConnectionId,
  name: rawName,
  phone: rawPhone,
}: CreateContactInput) => {
  const userId = requireAuthenticatedUserId(
    "Faça login para salvar um contato.",
  );
  const connectionId = rawConnectionId.trim();
  const name = rawName.trim();
  const phone = normalizePhone(rawPhone.trim());

  if (!connectionId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  validateContactFields(name, phone);

  const contactRef = doc(collection(db, "contacts"));

  await runTransaction(db, async (transaction) => {
    await readActiveConnectionInTransaction(transaction, connectionId, userId);
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

export const updateContact = async ({
  connectionId: rawConnectionId,
  contactId: rawContactId,
  name: rawName,
  phone: rawPhone,
}: UpdateContactInput) => {
  const userId = requireAuthenticatedUserId(
    "Faça login para salvar um contato.",
  );
  const connectionId = rawConnectionId.trim();
  const contactId = rawContactId.trim();
  const name = rawName.trim();
  const phone = normalizePhone(rawPhone.trim());

  if (!contactId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe um contato válido.",
    );
  }

  if (!connectionId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  validateContactFields(name, phone);

  await runTransaction(db, async (transaction) => {
    const contactRef = doc(db, "contacts", contactId);
    const contactSnapshot = await transaction.get(contactRef);

    if (!contactSnapshot.exists() || contactSnapshot.data().userId !== userId) {
      throw createFirestoreServiceError(
        "permission-denied",
        "Contato inválido.",
      );
    }

    await readActiveConnectionInTransaction(transaction, connectionId, userId);
    transaction.update(contactRef, {
      connectionId,
      connectionName: deleteField(),
      name,
      nameNormalized: normalizeSearchText(name),
      phone,
      updatedAt: serverTimestamp(),
    });
  });
};

export const deleteContact = async (contactId: string) => {
  const userId = requireAuthenticatedUserId("Faça login para continuar.");
  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe um contato válido.",
    );
  }

  await runTransaction(db, async (transaction) => {
    const contactRef = doc(db, "contacts", normalizedContactId);
    const contactSnapshot = await transaction.get(contactRef);

    if (!contactSnapshot.exists() || contactSnapshot.data().userId !== userId) {
      throw createFirestoreServiceError(
        "permission-denied",
        "Contato inválido.",
      );
    }

    await updateUsageInTransaction(transaction, userId, {
      contactsCount: -1,
    });
    transaction.delete(contactRef);
  });
};
