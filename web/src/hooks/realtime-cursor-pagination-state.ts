import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export type Cursor = QueryDocumentSnapshot<DocumentData> | null;

export interface PaginationScope {
  readonly enabled: boolean;
  readonly pageSize: number;
  readonly queryKey: string;
}

interface PageResult<Item> {
  hasNextPage: boolean;
  items: Item[];
  page: number;
}

export interface PaginationState<Item> {
  cursors: Map<number, Cursor>;
  error: string;
  requestedPage: number;
  result: PageResult<Item> | null;
  scope: PaginationScope;
}

interface LoadedPage<Item> {
  hasNextPage: boolean;
  items: Item[];
  nextCursor: Cursor;
}

export const createPaginationScope = (
  queryKey: string,
  pageSize: number,
  enabled: boolean,
) => ({ enabled, pageSize, queryKey });

export const createPaginationState = <Item>(
  scope: PaginationScope,
): PaginationState<Item> => ({
  cursors: new Map([[1, null]]),
  error: "",
  requestedPage: 1,
  result: null,
  scope,
});

export const getStateForScope = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
) => (state.scope === scope ? state : createPaginationState<Item>(scope));

export const readLoadedPage = <Item>(
  documents: QueryDocumentSnapshot<DocumentData>[],
  pageSize: number,
  mapDocument: (document: QueryDocumentSnapshot<DocumentData>) => Item,
): LoadedPage<Item> => {
  const visibleDocuments = documents.slice(0, pageSize);

  return {
    hasNextPage: documents.length > pageSize,
    items: visibleDocuments.map(mapDocument),
    nextCursor: visibleDocuments.at(-1) ?? null,
  };
};

export const applyLoadedPage = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
  page: number,
  loadedPage: LoadedPage<Item>,
): PaginationState<Item> => {
  const currentState = getStateForScope(state, scope);
  const nextPage = page + 1;
  const cursors = new Map(currentState.cursors);

  for (const storedPage of cursors.keys()) {
    if (storedPage > nextPage) cursors.delete(storedPage);
  }

  if (loadedPage.hasNextPage && loadedPage.nextCursor) {
    cursors.set(nextPage, loadedPage.nextCursor);
  } else {
    cursors.delete(nextPage);
  }

  return {
    ...currentState,
    cursors,
    error: "",
    requestedPage: page,
    result: {
      hasNextPage: loadedPage.hasNextPage,
      items: loadedPage.items,
      page,
    },
  };
};

export const returnFromEmptyPage = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
  emptyPage: number,
): PaginationState<Item> => ({
  ...getStateForScope(state, scope),
  error: "",
  requestedPage: Math.max(1, emptyPage - 1),
});

export const applyListenerError = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
  requestedPage: number,
  error: string,
): PaginationState<Item> => {
  const currentState = getStateForScope(state, scope);

  return {
    ...currentState,
    error,
    requestedPage: currentState.result?.page ?? requestedPage,
  };
};

export const requestPreviousPage = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
): PaginationState<Item> => {
  const currentState = getStateForScope(state, scope);

  if (currentState.result?.page !== currentState.requestedPage) {
    return currentState;
  }

  return {
    ...currentState,
    error: "",
    requestedPage: Math.max(1, currentState.requestedPage - 1),
  };
};

export const requestNextPage = <Item>(
  state: PaginationState<Item>,
  scope: PaginationScope,
): PaginationState<Item> => {
  const currentState = getStateForScope(state, scope);
  const nextPage = currentState.requestedPage + 1;
  const canNavigate =
    currentState.result?.page === currentState.requestedPage &&
    currentState.result.hasNextPage &&
    currentState.cursors.has(nextPage);

  if (!canNavigate) return currentState;

  return {
    ...currentState,
    error: "",
    requestedPage: nextPage,
  };
};
