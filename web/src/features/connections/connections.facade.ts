import {
  createConnection,
  upsertConnection,
  type Connection,
} from "./connections.model";
import type { ConnectionFormValues } from "./connections.schema";

interface HandleSaveConnectionParams {
  editingConnection: Connection | null;
  values: ConnectionFormValues;
}

export function handleSaveConnection(params: HandleSaveConnectionParams) {
  const { editingConnection, values } = params;

  if (editingConnection) {
    return upsertConnection({
      connectionId: editingConnection.id,
      name: values.name,
    });
  }

  return createConnection({ name: values.name });
}
