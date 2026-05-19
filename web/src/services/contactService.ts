import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { sanitizePhone } from "../utils/formatPhone";

type SaveContactParams = {
  connectionId: string;
  name: string;
  phone: string;
  userId: string;
};

type UpdateContactParams = {
  contactId: string;
  connectionId: string;
  name: string;
  phone: string;
};

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const getConnectionName = async (connectionId: string) => {
  const snapshot = await getDoc(doc(db, "connections", connectionId));

  return snapshot.exists() ? String(snapshot.data().name ?? "") : "";
};

export const createContact = async ({
  connectionId,
  name,
  phone,
  userId,
}: SaveContactParams) => {
  const connectionName = await getConnectionName(connectionId);

  return addDoc(collection(db, "contacts"), {
    connectionId,
    connectionName,
    createdAt: serverTimestamp(),
    name: name.trim(),
    nameNormalized: normalizeSearchText(name),
    phone: sanitizePhone(phone),
    updatedAt: serverTimestamp(),
    userId,
  });
};

export const updateContact = async ({
  contactId,
  connectionId,
  name,
  phone,
}: UpdateContactParams) => {
  const connectionName = await getConnectionName(connectionId);

  return updateDoc(doc(db, "contacts", contactId), {
    connectionId,
    connectionName,
    name: name.trim(),
    nameNormalized: normalizeSearchText(name),
    phone: sanitizePhone(phone),
    updatedAt: serverTimestamp(),
  });
};

export const deleteContact = (contactId: string) =>
  deleteDoc(doc(db, "contacts", contactId));
