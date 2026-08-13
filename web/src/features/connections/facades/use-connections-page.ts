import { useState } from "react";

import type { Connection } from "../models/connection.model";
import { useConnections } from "../models/use-connections";

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
