import {
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Observable } from "rxjs";

import {
  applyListenerFailure,
  applyLoadedPage,
  createPaginationScope,
  createPaginationState,
  getStateForScope,
  readLoadedPage,
  requestNextPage,
  requestPreviousPage,
  returnFromEmptyPage,
  type Cursor,
} from "@/utils/realtime-cursor-pagination-state";

interface UseRealtimeCursorPaginationParams<Item> {
  enabled: boolean;
  getPage$: (
    cursor: Cursor,
    resultLimit: number,
  ) => Observable<QueryDocumentSnapshot<DocumentData>[]>;
  mapDocument: (document: QueryDocumentSnapshot<DocumentData>) => Item;
  pageSize: number;
  queryKey: string;
}

export function useRealtimeCursorPagination<Item>(
  params: UseRealtimeCursorPaginationParams<Item>,
) {
  const { enabled, getPage$, mapDocument, pageSize, queryKey } = params;
  const scope = useMemo(
    () => createPaginationScope(queryKey, pageSize, enabled),
    [enabled, pageSize, queryKey],
  );
  const [paginationState, setPaginationState] = useState(() =>
    createPaginationState<Item>(scope),
  );
  const activeState = getStateForScope(paginationState, scope); // quando o scope muda, o state criado aqui serve como temporario
  const { requestedPage, result } = activeState;
  const cursor = activeState.cursors.get(requestedPage) ?? null;
  const currentPage = result?.page ?? 1;
  const hasLoadedRequestedPage = result?.page === requestedPage;

  useEffect(() => {
    if (!enabled) return;

    let isActive = true;
    const subscription = getPage$(cursor, pageSize + 1).subscribe({
      error: () => {
        if (!isActive) return;

        setPaginationState((currentState) =>
          applyListenerFailure(currentState, scope, requestedPage),
        );
      },
      next: (documents) => {
        if (!isActive) return;

        const loadedPage = readLoadedPage(documents, pageSize, mapDocument);

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
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [cursor, enabled, mapDocument, pageSize, requestedPage, scope, getPage$]);

  const goToPreviousPage = useCallback(() => {
    setPaginationState((currentState) =>
      requestPreviousPage(currentState, scope),
    );
  }, [scope]);

  const goToNextPage = useCallback(() => {
    setPaginationState((currentState) => requestNextPage(currentState, scope));
  }, [scope]);

  const isInitialLoading = enabled && !result;
  const isPageChanging = enabled && Boolean(result) && !hasLoadedRequestedPage;

  return {
    currentPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: enabled ? (result?.hasNextPage ?? false) : false,
    hasPreviousPage: enabled && currentPage > 1,
    isLoading: isInitialLoading,
    isPageChanging,
    items: enabled ? (result?.items ?? []) : [],
  };
}
