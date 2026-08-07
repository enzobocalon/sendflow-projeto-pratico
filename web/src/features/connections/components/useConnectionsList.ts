import { useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { deleteConnection } from "../../../services/connectionService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";
import type { Connection } from "../types";

type UseConnectionsListParams = {
  connections: Connection[];
  connectionsError: string;
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
};

const getDeleteConnectionErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "functions/failed-precondition"
  ) {
    return error instanceof Error
      ? error.message
      : "Não é possível excluir uma conexão com dados vinculados.";
  }

  return getFirebaseErrorMessage(error, "Não foi possível excluir a conexão.");
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteDialogOpen(false);
  };

  const clearDeleteModal = () => {
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

      await deleteConnection(connectionToDelete.id);

      if (editingConnection?.id === connectionToDelete.id) {
        onDeletedEditingConnection();
      }

      setIsDeleteDialogOpen(false);
    } catch (error) {
      const deleteErrorMessage = getDeleteConnectionErrorMessage(error);
      setError(deleteErrorMessage);

      if (deleteErrorMessage !== "Não foi possível excluir a conexão.") {
        setIsDeleteDialogOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    closeDeleteModal,
    clearDeleteModal,
    confirmDeleteConnection,
    connectionToDelete,
    connections: filteredConnections,
    error: error || connectionsError,
    isDeleteDialogOpen,
    isDeleting,
    isLoading: isLoadingConnections,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections: filteredConnections.length,
  };
};
