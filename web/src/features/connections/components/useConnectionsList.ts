import { useMemo, useState } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useDelete } from "../../../hooks/useDelete";
import { deleteConnection } from "../services/connectionService";
import {
  getFirebaseErrorCode,
  getFirebaseErrorDetail,
  getFirebaseErrorMessage,
} from "../../../utils/firebaseError";
import type { Connection } from "../types";

type UseConnectionsListParams = {
  connections: Connection[];
  connectionsError: string;
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
};

const getDeleteConnectionErrorMessage = (error: unknown) => {
  if (getFirebaseErrorCode(error) === "firestore/failed-precondition") {
    return (
      getFirebaseErrorDetail(error) ??
      "Não é possível excluir uma conexão com dados vinculados."
    );
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
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const {
    clearDeleteDialog: clearDeleteModal,
    clearDeleteFeedback,
    closeDeleteDialog: closeDeleteModal,
    confirmDelete: confirmDeleteConnection,
    deleteError,
    deleteSuccess,
    isDeleteDialogOpen,
    isDeleting,
    itemToDelete: connectionToDelete,
    requestDelete: requestDeleteConnection,
  } = useDelete<Connection>({
    deleteItem: (connection) => deleteConnection(connection.id),
    getErrorMessage: getDeleteConnectionErrorMessage,
    onDeleted: (connection) => {
      if (editingConnection?.id === connection.id) {
        onDeletedEditingConnection();
      }
    },
    successMessage: "Conexão excluída com sucesso.",
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
