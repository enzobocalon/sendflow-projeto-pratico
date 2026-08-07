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
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
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
    setDeleteError("");
    setDeleteSuccess("");
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

    setDeleteError("");
    setDeleteSuccess("");
    setIsDeleting(true);

    try {
      if (!user) {
        setDeleteError("Faça login para excluir uma conexão.");
        return;
      }

      await deleteConnection(connectionToDelete.id);

      if (editingConnection?.id === connectionToDelete.id) {
        onDeletedEditingConnection();
      }

      setDeleteSuccess("Conexão excluída com sucesso.");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const deleteErrorMessage = getDeleteConnectionErrorMessage(error);
      setDeleteError(deleteErrorMessage);

      if (deleteErrorMessage !== "Não foi possível excluir a conexão.") {
        setIsDeleteDialogOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const clearDeleteFeedback = () => {
      setDeleteError("");
      setDeleteSuccess("");
    }

  return {
    clearDeleteFeedback,
    closeDeleteModal,
    clearDeleteModal,
    confirmDeleteConnection,
    connectionToDelete,
    connections: filteredConnections,
    deleteError,
    deleteSuccess,
    error: connectionsError,
    isDeleteDialogOpen,
    isDeleting,
    isLoading: isLoadingConnections,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections: filteredConnections.length,
  };
};
