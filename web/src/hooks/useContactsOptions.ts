import { normalizeSearchText } from "@sendflow/shared";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback } from "react";
import {
  mapContactDocument,
  subscribeToContactsPage,
} from "../features/contacts/services/contactService";
import { useAuth } from "./useAuth";
import { useRealtimeCursorPagination } from "./useRealtimeCursorPagination";

type UseContactsOptionsParams = {
  connectionId?: string;
  enabled?: boolean;
  pageSize?: number;
  searchTerm?: string;
};

const DEFAULT_PAGE_SIZE = 30;

export function useContactsOptions({
  connectionId,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  searchTerm = "",
}: UseContactsOptionsParams = {}) {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, connectionId ?? "all", normalizedSearchTerm].join(
    ":",
  );

  const subscribeToPage = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
      onValue: Parameters<typeof subscribeToContactsPage>[1],
      onError: Parameters<typeof subscribeToContactsPage>[2],
    ) => {
      return subscribeToContactsPage(
        {
          connectionId,
          cursor,
          resultLimit,
          searchTerm: normalizedSearchTerm,
          userId,
        },
        onValue,
        onError,
      );
    },
    [connectionId, normalizedSearchTerm, userId],
  );

  const {
    currentPage,
    error,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
    items: contacts,
  } = useRealtimeCursorPagination({
    enabled: canLoad,
    mapDocument: mapContactDocument,
    pageSize,
    queryKey,
    resourceLabel: "contatos",
    subscribeToPage,
  });

  return {
    contacts,
    currentPage,
    error,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
  };
}
