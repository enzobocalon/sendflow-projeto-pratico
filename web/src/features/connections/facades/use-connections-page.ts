import { useState } from "react";
import { useConnections } from "../models/use-connections";
import type { Connection } from "../types";

export function useConnectionsPage() {
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = useConnections();
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
}
