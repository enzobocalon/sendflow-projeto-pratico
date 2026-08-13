import { useMemo, useState } from "react";
import { useDebouncedValue } from "../../../hooks/use-debounced-value";
import { useDelete } from "../../../facades/use-delete";
import { deleteConnection } from "../models/connection.model";
import {
  getFirebaseErrorCode,
  getFirebaseErrorDetail,
  getFirebaseErrorMessage,
} from "../../../utils/firebase-error";
import type { Connection } from "../types";

interface UseConnectionsListParams {
  connections: Connection[];
  connectionsError: string;
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
}

const getDeleteConnectionErrorMessage = (error: unknown) => {
  if (getFirebaseErrorCode(error) === "firestore/failed-precondition") {
    return (
      getFirebaseErrorDetail(error) ??
      "Não é possível excluir uma conexão com dados vinculados."
    );
  }

  return getFirebaseErrorMessage(error, "Não foi possível excluir a conexão.");
};

export function useConnectionsList(params: UseConnectionsListParams) {
  const {
    connections,
    connectionsError,
    editingConnection,
    isLoadingConnections,
    onDeletedEditingConnection,
  } = params;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const {
    clearDeleteFeedback,
    deleteError,
    deleteSuccess,
    isDeleting,
    requestDelete: requestDeleteConnection,
  } = useDelete<Connection>({
    deleteItem: (connection) => deleteConnection(connection.id),
    dialogTitle: "Excluir conexão?",
    getDialogMessage: (connection) =>
      `Tem certeza que deseja excluir a conexão "${connection.name}"? Esta ação não pode ser desfeita.`,
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
    connections: filteredConnections,
    deleteError,
    deleteSuccess,
    error: connectionsError,
    isDeleting,
    isLoading: isLoadingConnections,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections: filteredConnections.length,
  };
}
