import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDelete } from "@/hooks/use-delete";

import { deleteConnection, type Connection } from "../models/connection.model";

interface UseConnectionsListParams {
  connections: Connection[];
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
}

export function useConnectionsList(params: UseConnectionsListParams) {
  const {
    connections,
    editingConnection,
    isLoadingConnections,
    onDeletedEditingConnection,
  } = params;
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const handleDeletedConnection = (connection: Connection) => {
    if (editingConnection?.id === connection.id) {
      onDeletedEditingConnection();
    }
  };

  const {
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete: requestDeleteConnection },
  } = useDelete<Connection>({
    confirmationMessage: (connection) =>
      `Tem certeza que deseja excluir a conexão "${connection.name}"? Esta ação não pode ser desfeita.`,
    handleDelete: deleteConnection,
    onDeleted: handleDeletedConnection,
  });

  const filteredConnections = useMemo(() => {
    const normalizedSearchTerm = debouncedSearchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return connections;
    }

    return connections.filter((connection) =>
      connection.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [connections, debouncedSearchTerm]);

  return {
    state: {
      connections: filteredConnections,
      feedback,
      isDeleting,
      isLoading: isLoadingConnections,
      searchTerm,
      totalConnections: filteredConnections.length,
    },
    actions: {
      clearFeedback,
      requestDeleteConnection,
      setSearchTerm,
    },
  };
}
