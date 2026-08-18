import { normalizeSearchText } from "@sendflow/shared";
import { useState } from "react";

import { useAuth } from "@/features/auth/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDelete } from "@/hooks/use-delete";
import { useRealtimeCursorPagination } from "@/hooks/use-realtime-cursor-pagination";

import {
  deleteConnection,
  getConnectionsPage$,
  mapConnectionDocument,
  type Connection,
} from "../connections.model";

interface UseConnectionsListParams {
  editingConnection: Connection | null;
  onDeletedEditingConnection: () => void;
}

const CONNECTIONS_PAGE_SIZE = 30;

export function useConnectionsList(params: UseConnectionsListParams) {
  const { editingConnection, onDeletedEditingConnection } = params;
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const normalizedSearchTerm = normalizeSearchText(debouncedSearchTerm);
  const userId = user?.uid ?? "";

  const handleDeletedConnection = (connection: Connection) => {
    if (editingConnection?.id === connection.id) {
      onDeletedEditingConnection();
    }
  };

  const {
    state: { isDeleting },
    actions: { requestDelete: requestDeleteConnection },
  } = useDelete<Connection>({
    confirmationMessage: (connection) =>
      `Tem certeza que deseja excluir a conexão "${connection.name}"? Esta ação não pode ser desfeita.`,
    handleDelete: deleteConnection,
    onDeleted: handleDeletedConnection,
  });

  const {
    currentPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
    items: connections,
  } = useRealtimeCursorPagination<Connection>({
    enabled: Boolean(user),
    getPage$: (cursor, resultLimit) =>
      getConnectionsPage$({
        cursor,
        resultLimit,
        searchTerm: normalizedSearchTerm,
      }),
    mapDocument: mapConnectionDocument,
    pageSize: CONNECTIONS_PAGE_SIZE,
    queryKey: [userId, normalizedSearchTerm].join(":"),
  });

  return {
    state: {
      connections,
      currentPage,
      hasNextPage,
      hasPreviousPage,
      isDeleting,
      isLoading,
      isPageChanging,
      searchTerm,
    },
    actions: {
      goToNextPage,
      goToPreviousPage,
      requestDeleteConnection,
      setSearchTerm,
    },
  };
}
