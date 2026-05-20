import { useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  deleteConnection,
  hasConnectionDependencies,
} from "../../../services/connectionService";
import type { Connection } from "../types";

type UseConnectionsListParams = {
  connections: Connection[];
  connectionsError: string;
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
};

export const useConnectionsList = ({
  connections,
  connectionsError,
  editingConnection,
  isLoadingConnections,
  onDeletedEditingConnection,
}: UseConnectionsListParams) => {
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const { user } = useAuth();
  const filteredConnections = useMemo(() => {
    const normalizedSearchTerm = debouncedSearchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return connections;
    }

    return connections.filter((connection) =>
      connection.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [connections, debouncedSearchTerm]);

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
      if (!user) {
        setError("Faça login para excluir uma conexão.");
        return;
      }

      const hasLinkedData = await hasConnectionDependencies({
        connectionId: connectionToDelete.id,
        userId: user.uid,
      });

      if (hasLinkedData) {
        setError(
          "Não é possível excluir uma conexão com contatos ou mensagens vinculados.",
        );
        setConnectionToDelete(null);
        return;
      }

      await deleteConnection(connectionToDelete.id);

      if (editingConnection?.id === connectionToDelete.id) {
        onDeletedEditingConnection();
      }

      setConnectionToDelete(null);
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
    error: error || connectionsError,
    isDeleting,
    isLoading: isLoadingConnections,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections: filteredConnections.length,
  };
};
