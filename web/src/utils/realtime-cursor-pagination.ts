import type {
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

export type Cursor = QueryDocumentSnapshot<DocumentData> | null;

export interface PageResult<Item> {
  hasNextPage: boolean;
  items: Item[];
  nextCursor: Cursor;
  page: number;
  scopeKey: string | null;
}

interface PaginationNavigation {
  cursors: Cursor[];
  requestedPage: number;
  scopeKey: string;
}

interface PaginationAction {
  cursor?: Cursor;
  scopeKey: string;
  type: "next" | "previous";
}

interface CreatePageResultParams<Item> {
  documents: QueryDocumentSnapshot<DocumentData>[];
  mapDocument: (document: QueryDocumentSnapshot<DocumentData>) => Item;
  page: number;
  pageSize: number;
  scopeKey: string;
}

export const createNavigation = (
  scopeKey: string,
): PaginationNavigation => ({
  cursors: [null],
  requestedPage: 1,
  scopeKey,
});

export const getActiveNavigation = (
  navigation: PaginationNavigation,
  scopeKey: string,
) =>
  navigation.scopeKey === scopeKey
    ? navigation
    : createNavigation(scopeKey);

export const createEmptyPage = <Item>(): PageResult<Item> => ({
  hasNextPage: false,
  items: [],
  nextCursor: null,
  page: 1,
  scopeKey: null,
});

export const createPageResult = <Item>(
  params: CreatePageResultParams<Item>,
): PageResult<Item> => {
  const { documents, mapDocument, page, pageSize, scopeKey } = params;
  const visibleDocuments = documents.slice(0, pageSize);

  return {
    hasNextPage: documents.length > pageSize,
    items: visibleDocuments.map(mapDocument),
    nextCursor: visibleDocuments.at(-1) ?? null,
    page,
    scopeKey,
  };
};

export const paginationReducer = (
  navigation: PaginationNavigation,
  action: PaginationAction,
): PaginationNavigation => {
  const currentNavigation = getActiveNavigation(navigation, action.scopeKey);

  if (action.type === "previous") {
    return {
      ...currentNavigation,
      requestedPage: Math.max(1, currentNavigation.requestedPage - 1),
    };
  }

  if (!action.cursor) return currentNavigation;

  const cursors = currentNavigation.cursors.slice(
    0,
    currentNavigation.requestedPage,
  );
  cursors[currentNavigation.requestedPage] = action.cursor;

  return {
    ...currentNavigation,
    cursors,
    requestedPage: currentNavigation.requestedPage + 1,
  };
};
