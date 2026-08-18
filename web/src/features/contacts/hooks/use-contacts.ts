import { normalizeSearchText } from "@sendflow/shared";

import { useAuth } from "@/features/auth/use-auth";
import { useRealtimeCursorPagination } from "@/hooks/use-realtime-cursor-pagination";

import { getContactsPage$, mapContactDocument } from "../contacts.model";

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

  const { items: contacts, ...pagination } = useRealtimeCursorPagination({
    enabled: canLoad,
    getPage$: (cursor, resultLimit) =>
      getContactsPage$({
        connectionId,
        cursor,
        resultLimit,
        searchTerm: normalizedSearchTerm,
      }),
    mapDocument: mapContactDocument,
    pageSize,
    queryKey,
  });

  return { contacts, ...pagination };
}
