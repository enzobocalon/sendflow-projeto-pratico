import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

type SaveConnectionParams = {
  name: string;
  userId: string;
};

type UpdateConnectionParams = {
  connectionId: string;
  name: string;
};

export const createConnection = ({ name, userId }: SaveConnectionParams) =>
  addDoc(collection(db, "connections"), {
    createdAt: serverTimestamp(),
    name: name.trim(),
    updatedAt: serverTimestamp(),
    userId,
  });

export const updateConnection = ({
  connectionId,
  name,
}: UpdateConnectionParams) =>
  updateDoc(doc(db, "connections", connectionId), {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  });

export const deleteConnection = (connectionId: string) =>
  deleteDoc(doc(db, "connections", connectionId));

export const hasConnectionDependencies = async ({
  connectionId,
  userId,
}: {
  connectionId: string;
  userId: string;
}) => {
  const contactsCount = await getCountFromServer(
    query(
      collection(db, "contacts"),
      where("connectionId", "==", connectionId),
      where("userId", "==", userId),
    ),
  );

  if (contactsCount.data().count > 0) {
    return true;
  }

  const messagesCount = await getCountFromServer(
    query(
      collection(db, "messages"),
      where("connectionId", "==", connectionId),
      where("userId", "==", userId),
    ),
  );

  return messagesCount.data().count > 0;
};
