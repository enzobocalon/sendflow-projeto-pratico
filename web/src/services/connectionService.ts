import type {
  CreateConnectionRequest,
  DeleteConnectionRequest,
  MutationResponse,
  UpdateConnectionRequest,
} from "@sendflow/shared";
import { callFirebaseFunction } from "./firebase-callable";

export const createConnection = ({ name }: CreateConnectionRequest) =>
  callFirebaseFunction<CreateConnectionRequest, MutationResponse>(
    "createConnection",
    {
      name,
    },
  );

export const updateConnection = ({
  connectionId,
  name,
}: UpdateConnectionRequest) =>
  callFirebaseFunction<UpdateConnectionRequest, MutationResponse>(
    "updateConnection",
    {
      connectionId,
      name,
    },
  );

export const deleteConnection = (connectionId: string) =>
  callFirebaseFunction<DeleteConnectionRequest, MutationResponse>(
    "deleteConnection",
    {
      connectionId,
    },
  );
