import { collection, getCountFromServer, query, where } from "firebase/firestore";
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
}: UpdateConnectionParams) => {
  const updateConnectionFunction = httpsCallable<
    { connectionId: string; name: string },
    { id: string }
  >(functions, "updateConnection");

  return updateConnectionFunction({
    connectionId,
    name,
  });
};

export const deleteConnection = (connectionId: string) => {
  const deleteConnectionFunction = httpsCallable<
    { connectionId: string },
    { id: string }
  >(functions, "deleteConnection");

  return deleteConnectionFunction({ connectionId });
};
