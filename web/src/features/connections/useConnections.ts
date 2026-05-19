import { useState } from "react";
import type { Connection } from "./types";

export const useConnections = () => {
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null,
  );

  const editConnection = (connection: Connection) => {
    setEditingConnection(connection);
  };

  const cancelEdit = () => {
    setEditingConnection(null);
  };

  return {
    cancelEdit,
    editConnection,
    editingConnection,
  };
};
