import {
  collection,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback } from "react";
import type { Message, MessageStatus } from "../features/messages/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { useRealtimeCursorPagination } from "./useRealtimeCursorPagination";

type UseMessagesOptionsParams = {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
};

const DEFAULT_PAGE_SIZE = 30;

const mapMessageDocument = (
  document: QueryDocumentSnapshot<DocumentData>,
): Message => ({
  id: document.id,
  ...(document.data() as Omit<Message, "id">),
});

export function useMessagesOptions({
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  status = "all",
}: UseMessagesOptionsParams = {}) {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, status].join(":");

  const createQuery = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
    ) => {
      const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      ];

      if (status !== "all") {
        constraints.splice(1, 0, where("status", "==", status));
      }

      if (cursor) constraints.push(startAfter(cursor));
      constraints.push(limit(resultLimit));

      return query(collection(db, "messages"), ...constraints);
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
    createQuery,
    enabled: canLoad,
    mapDocument: mapMessageDocument,
    pageSize,
    queryKey,
    resourceLabel: "mensagens",
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
