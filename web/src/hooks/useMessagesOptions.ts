import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback } from "react";
import {
  mapMessageDocument,
  subscribeToMessagesPage,
} from "../features/messages/services/messageService";
import type { MessageStatus } from "../features/messages/types";
import { useAuth } from "./useAuth";
import { useRealtimeCursorPagination } from "./useRealtimeCursorPagination";

type UseMessagesOptionsParams = {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
};

const DEFAULT_PAGE_SIZE = 30;

export function useMessagesOptions({
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  status = "all",
}: UseMessagesOptionsParams = {}) {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, status].join(":");

  const subscribeToPage = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
      onValue: Parameters<typeof subscribeToMessagesPage>[1],
      onError: Parameters<typeof subscribeToMessagesPage>[2],
    ) => {
      return subscribeToMessagesPage(
        {
          cursor,
          resultLimit,
          status,
          userId,
        },
        onValue,
        onError,
      );
    },
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
    subscribeToPage,
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
