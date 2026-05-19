import { useState } from "react";
import type { Connection } from "./types";

export const useConnections = () => {
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null,
  );
  const [totalConnections, setTotalConnections] = useState(0);

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
    setTotalConnections,
    totalConnections,
  };
};
