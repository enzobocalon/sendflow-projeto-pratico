import {
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFirestoreErrorMessage,
  type FirestoreListResource,
} from "@/utils/firestore-error";

import {
  applyListenerError,
  applyLoadedPage,
  createPaginationScope,
  createPaginationState,
  getStateForScope,
  readLoadedPage,
  requestNextPage,
  requestPreviousPage,
  returnFromEmptyPage,
  type Cursor,
} from "./realtime-cursor-pagination-state";

interface UseRealtimeCursorPaginationParams<Item> {
  enabled: boolean;
  mapDocument: (document: QueryDocumentSnapshot<DocumentData>) => Item;
  pageSize: number;
  queryKey: string;
  resourceLabel: FirestoreListResource;
  subscribeToPage: (
    cursor: Cursor,
    resultLimit: number,
    onValue: (snapshot: QuerySnapshot<DocumentData>) => void,
    onError: (error: FirestoreError) => void,
  ) => Unsubscribe;
}

export function useRealtimeCursorPagination<Item>(
  params: UseRealtimeCursorPaginationParams<Item>,
) {
  const {
    enabled,
    mapDocument,
    pageSize,
    queryKey,
    resourceLabel,
    subscribeToPage,
  } = params;
  const scope = useMemo(
    () => createPaginationScope(queryKey, pageSize, enabled),
    [enabled, pageSize, queryKey],
  );
  const [paginationState, setPaginationState] = useState(() =>
    createPaginationState<Item>(scope),
  );
  const activeState = getStateForScope(paginationState, scope); // quando o scope muda, o state criado aqui serve como temporario
  const { error, requestedPage, result } = activeState;
  const cursor = activeState.cursors.get(requestedPage) ?? null;
  const currentPage = result?.page ?? 1;
  const hasLoadedRequestedPage = result?.page === requestedPage;

  useEffect(() => {
    if (!enabled) return;

    let isActive = true;
    const unsubscribe = subscribeToPage(
      cursor,
      pageSize + 1,
      (snapshot) => {
        if (!isActive) return;

        const loadedPage = readLoadedPage(snapshot.docs, pageSize, mapDocument);

        if (requestedPage > 1 && loadedPage.items.length === 0) {
          // Guard
          setPaginationState((currentState) =>
            returnFromEmptyPage(currentState, scope, requestedPage),
          );
          return;
        }

        setPaginationState((currentState) =>
          applyLoadedPage(currentState, scope, requestedPage, loadedPage),
        );
      },
      (snapshotError) => {
        if (!isActive) return;

        const errorMessage = getFirestoreErrorMessage(
          snapshotError,
          resourceLabel,
        );
        setPaginationState((currentState) =>
          applyListenerError(currentState, scope, requestedPage, errorMessage),
        );
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [
    cursor,
    enabled,
    mapDocument,
    pageSize,
    requestedPage,
    resourceLabel,
    scope,
    subscribeToPage,
  ]);

  const goToPreviousPage = useCallback(() => {
    setPaginationState((currentState) =>
      requestPreviousPage(currentState, scope),
    );
  }, [scope]);

  const goToNextPage = useCallback(() => {
    setPaginationState((currentState) => requestNextPage(currentState, scope));
  }, [scope]);

  const isInitialLoading = enabled && !result && !error;
  const isPageChanging = enabled && Boolean(result) && !hasLoadedRequestedPage;

  return {
    currentPage,
    error: enabled ? error : "",
    goToNextPage,
    goToPreviousPage,
    hasNextPage: enabled ? (result?.hasNextPage ?? false) : false,
    hasPreviousPage: enabled && currentPage > 1,
    isLoading: isInitialLoading,
    isPageChanging,
    items: enabled ? (result?.items ?? []) : [],
  };
}
