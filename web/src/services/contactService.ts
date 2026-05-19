import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

export const createContact = ({
  connectionId,
  name,
  phone,
  userId,
}: SaveContactParams) =>
  addDoc(collection(db, "contacts"), {
    connectionId,
    createdAt: serverTimestamp(),
    name: name.trim(),
    phone: sanitizePhone(phone),
    updatedAt: serverTimestamp(),
    userId,
  });

export const updateContact = ({
  contactId,
  connectionId,
  name,
  phone,
}: UpdateContactParams) =>
  updateDoc(doc(db, "contacts", contactId), {
    connectionId,
    name: name.trim(),
    phone: sanitizePhone(phone),
    updatedAt: serverTimestamp(),
  });

export const deleteContact = (contactId: string) =>
  deleteDoc(doc(db, "contacts", contactId));
