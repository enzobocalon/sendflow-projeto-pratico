import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { useRealtimeCursorPagination } from "../../../hooks/use-realtime-cursor-pagination";
import type { MessageStatus } from "../types";
import { getMessagesPageRealtime, mapMessageDocument } from "./message.model";

interface UseMessagesParams {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
}

const DEFAULT_PAGE_SIZE = 30;

export function useMessages(params: UseMessagesParams = {}) {
  const {
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    status = "all",
  } = params;
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, status].join(":");

  const getPageRealtime = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
      onValue: Parameters<typeof getMessagesPageRealtime>[1],
      onError: Parameters<typeof getMessagesPageRealtime>[2],
    ) =>
      getMessagesPageRealtime(
        { cursor, resultLimit, status, userId },
        onValue,
        onError,
      ),
    [status, userId],
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
    items: messages,
  } = useRealtimeCursorPagination({
    enabled: canLoad,
    mapDocument: mapMessageDocument,
    pageSize,
    queryKey,
    resourceLabel: "mensagens",
    subscribeToPage: getPageRealtime,
  });

  return {
    currentPage,
    error,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
    messages,
  };
}
