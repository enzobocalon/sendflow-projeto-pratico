import { useMemo, useState } from "react";

import { useDelete } from "@/facades/use-delete";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  getFirebaseErrorCode,
  getFirebaseErrorDetail,
  getFirebaseErrorMessage,
} from "@/utils/firebase-error";

import { deleteConnection, type Connection } from "../models/connection.model";

interface UseConnectionsListParams {
  connections: Connection[];
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
    editingConnection,
    isLoadingConnections,
    onDeletedEditingConnection,
  } = params;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const {
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete: requestDeleteConnection },
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
