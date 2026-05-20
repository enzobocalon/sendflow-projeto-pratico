import { useState } from "react";
import { useConnectionsOptions } from "../../hooks/useConnectionsOptions";
import type { Connection } from "./types";

export const useConnections = () => {
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = useConnectionsOptions();
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
    connections,
    connectionsError,
    editConnection,
    editingConnection,
    isLoadingConnections,
    totalConnections: connections.length,
  };
};
