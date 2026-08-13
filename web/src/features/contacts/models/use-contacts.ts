import { normalizeSearchText } from "@sendflow/shared";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeCursorPagination } from "@/hooks/use-realtime-cursor-pagination";

import { getContactsPageRealtime, mapContactDocument } from "./contact.model";

interface UseContactsParams {
  connectionId?: string;
  enabled?: boolean;
  pageSize?: number;
  searchTerm?: string;
}

const DEFAULT_PAGE_SIZE = 30;

export function useContacts(params: UseContactsParams = {}) {
  const {
    connectionId,
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    searchTerm = "",
  } = params;
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, connectionId ?? "all", normalizedSearchTerm].join(
    ":",
  );

  const getPageRealtime = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
      onValue: Parameters<typeof getContactsPageRealtime>[1],
      onError: Parameters<typeof getContactsPageRealtime>[2],
    ) =>
      getContactsPageRealtime(
        {
          connectionId,
          cursor,
          resultLimit,
          searchTerm: normalizedSearchTerm,
          userId,
        },
        onValue,
        onError,
      ),
    [connectionId, normalizedSearchTerm, userId],
  );

  const {
    currentPage,
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
    subscribeToPage: getPageRealtime,
  });

  return {
    contacts,
    currentPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
  };
}
