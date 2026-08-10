import {
  collection,
  endAt,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback } from "react";
import type { Contact } from "../features/contacts/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { useRealtimeCursorPagination } from "./useRealtimeCursorPagination";

type UseContactsOptionsParams = {
  connectionId?: string;
  enabled?: boolean;
  pageSize?: number;
  searchTerm?: string;
};

const DEFAULT_PAGE_SIZE = 30;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const mapContactDocument = (
  document: QueryDocumentSnapshot<DocumentData>,
): Contact =>
  ({
    id: document.id,
    ...document.data(),
  }) as Contact;

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

  const createQuery = useCallback(
    (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      resultLimit: number,
    ) => {
      const constraints: QueryConstraint[] = [
        where("userId", "==", userId),
        orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
      ];

      if (connectionId) {
        constraints.splice(1, 0, where("connectionId", "==", connectionId));
      }

      if (normalizedSearchTerm) {
        if (!cursor) constraints.push(startAt(normalizedSearchTerm));
        constraints.push(endAt(`${normalizedSearchTerm}\uf8ff`));
      }

      if (cursor) constraints.push(startAfter(cursor));
      constraints.push(limit(resultLimit));

      return query(collection(db, "contacts"), ...constraints);
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
    createQuery,
    enabled: canLoad,
    mapDocument: mapContactDocument,
    pageSize,
    queryKey,
    resourceLabel: "contatos",
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
