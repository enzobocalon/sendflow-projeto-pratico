import { useState } from "react";

import type { Connection } from "../connections.model";
import { useConnections } from "./use-connections";

export function useConnectionsPage() {
  const { connections, isLoading: isLoadingConnections } = useConnections();
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
    editConnection,
    editingConnection,
    isLoadingConnections,
    totalConnections: connections.length,
  };
}
