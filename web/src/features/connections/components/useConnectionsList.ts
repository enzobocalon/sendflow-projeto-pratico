import { useMemo, useState } from "react";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { deleteConnection } from "../../../services/connectionService";
import type { Connection } from "../types";

type UseConnectionsListParams = {
  editingConnection: Connection | null;
  onDeletedEditingConnection: () => void;
};

export const useConnectionsList = ({
  editingConnection,
  onDeletedEditingConnection,
}: UseConnectionsListParams) => {
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { connections, isLoading } = useConnectionsOptions();

  const filteredConnections = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return connections;
    }

    return connections.filter((connection) =>
      connection.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [connections, searchTerm]);

  const requestDeleteConnection = (connection: Connection) => {
    setError("");
    setConnectionToDelete(connection);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setConnectionToDelete(null);
  };

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteConnection(connectionToDelete.id);

      if (editingConnection?.id === connectionToDelete.id) {
        onDeletedEditingConnection();
      }

      closeDeleteModal();
    } catch {
      setError("Não foi possível excluir a conexão.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    closeDeleteModal,
    confirmDeleteConnection,
    connectionToDelete,
    connections: filteredConnections,
    error,
    isDeleting,
    isLoading,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections: connections.length,
  };
};
