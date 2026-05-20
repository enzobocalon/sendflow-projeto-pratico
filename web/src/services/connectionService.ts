import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

const MAX_CONNECTIONS_PER_USER = 100;

type SaveConnectionParams = {
  name: string;
  userId: string;
};

type UpdateConnectionParams = {
  connectionId: string;
  name: string;
};

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

export const createConnection = async ({ name, userId }: SaveConnectionParams) => {
  const connectionsCount = await getCountFromServer(
    query(collection(db, "connections"), where("userId", "==", userId)),
  );

  if (connectionsCount.data().count >= MAX_CONNECTIONS_PER_USER) {
    throw new Error("connections-limit-reached");
  }

  const createConnectionFunction = httpsCallable<
    { name: string },
    { id: string }
  >(functions, "createConnection");

  return createConnectionFunction({ name });
};

export const updateConnection = ({
  connectionId,
  name,
}: UpdateConnectionParams) =>
  updateDoc(doc(db, "connections", connectionId), {
    name: name.trim(),
    nameNormalized: normalizeSearchText(name),
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
