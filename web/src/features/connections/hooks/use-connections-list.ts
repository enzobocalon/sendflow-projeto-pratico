import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDelete } from "@/hooks/use-delete";

import { deleteConnection, type Connection } from "../connections.model";

interface UseConnectionsListParams {
  connections: Connection[];
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onDeletedEditingConnection: () => void;
}

const CONNECTIONS_PAGE_SIZE = 30;

export function useConnectionsList(params: UseConnectionsListParams) {
  const {
    connections,
    editingConnection,
    isLoadingConnections,
    onDeletedEditingConnection,
  } = params;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

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

  const filteredConnections = useMemo(() => {
    const normalizedSearchTerm = debouncedSearchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return connections;
    }

    return connections.filter((connection) =>
      connection.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [connections, debouncedSearchTerm]);
  
  const totalPages = Math.max(
    1,
    Math.ceil(filteredConnections.length / CONNECTIONS_PAGE_SIZE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * CONNECTIONS_PAGE_SIZE;
  const paginatedConnections = filteredConnections.slice(
    pageStart,
    pageStart + CONNECTIONS_PAGE_SIZE,
  );

  const goToNextPage = () => {
    setCurrentPage(Math.min(activePage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(Math.max(activePage - 1, 1));
  };

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return {
    state: {
      connections: paginatedConnections,
      currentPage: activePage,
      hasNextPage: activePage < totalPages,
      hasPreviousPage: activePage > 1,
      isDeleting,
      isLoading: isLoadingConnections,
      searchTerm,
      totalConnections: paginatedConnections.length,
    },
    actions: {
      goToNextPage,
      goToPreviousPage,
      requestDeleteConnection,
      setSearchTerm: updateSearchTerm,
    },
  };
}
