import {
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useReducer } from "react";
import { map, type Observable } from "rxjs";

import { useRxValue } from "@/hooks/use-rx-value";
import {
  createEmptyPage,
  createNavigation,
  createPageResult,
  getActiveNavigation,
  paginationReducer,
  type Cursor,
} from "@/utils/realtime-cursor-pagination";

interface UseRealtimeCursorPaginationParams<T> {
  enabled: boolean;
  getPage$: (
    cursor: Cursor,
    resultLimit: number,
  ) => Observable<QueryDocumentSnapshot<DocumentData>[]>;
  mapDocument: (document: QueryDocumentSnapshot<DocumentData>) => T;
  pageSize: number;
  queryKey: string;
}

export function useRealtimeCursorPagination<T>(
  params: UseRealtimeCursorPaginationParams<T>,
) {
  const { enabled, getPage$, mapDocument, pageSize, queryKey } = params;

  const scopeKey = useMemo(
    () => JSON.stringify([queryKey, pageSize]),
    [pageSize, queryKey],
  );

  const [navigation, dispatchNavigation] = useReducer(
    paginationReducer,
    scopeKey,
    createNavigation,
  );

  const activeNavigation = getActiveNavigation(navigation, scopeKey);
  const { requestedPage } = activeNavigation;
  const cursor = activeNavigation.cursors[requestedPage - 1] ?? null;
  const initialPage = useMemo(() => createEmptyPage<T>(), []);

  const [pageResult, isLoadingPage] = useRxValue(
    () =>
      getPage$(cursor, pageSize + 1).pipe(
        map((documents) =>
          createPageResult({
            documents,
            mapDocument,
            page: requestedPage,
            pageSize,
            scopeKey,
          }),
        ),
      ),
    [enabled ? scopeKey : null, requestedPage],
    initialPage,
    false,
  );
  const hasResultForScope = pageResult.scopeKey === scopeKey;
  const hasLoadedRequestedPage =
    hasResultForScope && pageResult.page === requestedPage;

  useEffect(() => {
    if (
      !hasLoadedRequestedPage ||
      requestedPage === 1 ||
      pageResult.items.length > 0
    ) {
      return;
    }

    dispatchNavigation({
      page: requestedPage - 1,
      scopeKey,
      type: "set-page",
    });
  }, [hasLoadedRequestedPage, pageResult.items.length, requestedPage, scopeKey]);

  const goToPreviousPage = () => {
    if (!hasLoadedRequestedPage) return;

    dispatchNavigation({ scopeKey, type: "previous" });
  };

  const goToNextPage = () => {
    if (
      !hasLoadedRequestedPage ||
      !pageResult.hasNextPage ||
      !pageResult.nextCursor
    ) {
      return;
    }

    dispatchNavigation({
      cursor: pageResult.nextCursor,
      scopeKey,
      type: "next",
    });
  };

  const visibleResult = hasResultForScope ? pageResult : initialPage;
  const isInitialLoading = enabled && !hasResultForScope && isLoadingPage;
  const isPageChanging = enabled && hasResultForScope && isLoadingPage;

  return {
    currentPage: enabled ? visibleResult.page : 1,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: enabled && visibleResult.hasNextPage,
    hasPreviousPage: enabled && visibleResult.page > 1,
    isLoading: isInitialLoading,
    isPageChanging,
    items: enabled ? visibleResult.items : [],
  };
}
