import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

type SaveConnectionParams = {
  name: string;
};

type UpdateConnectionParams = {
  connectionId: string;
  name: string;
};

export const createConnection = async ({ name }: SaveConnectionParams) => {
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
