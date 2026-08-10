import {
  callFirebaseFunction,
  type MutationResponse,
} from "./firebase-callable";

type SaveConnectionParams = {
  name: string;
};

type UpdateConnectionParams = {
  connectionId: string;
  name: string;
};

export const createConnection = ({ name }: SaveConnectionParams) =>
  callFirebaseFunction<SaveConnectionParams, MutationResponse>(
    "createConnection",
    {
      name,
    },
  );

export const updateConnection = ({
  connectionId,
  name,
}: UpdateConnectionParams) =>
  callFirebaseFunction<UpdateConnectionParams, MutationResponse>(
    "updateConnection",
    {
      connectionId,
      name,
    },
  );

export const deleteConnection = (connectionId: string) =>
  callFirebaseFunction<{ connectionId: string }, MutationResponse>(
    "deleteConnection",
    {
      connectionId,
    },
  );
