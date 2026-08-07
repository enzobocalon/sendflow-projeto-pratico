import {
  collection,
  endAt,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Contact } from "../features/contacts/types";
import { db } from "../lib/firebase";
import { getFirestoreErrorMessage } from "../utils/firestoreError";
import { useAuth } from "./useAuth";

type UseContactsOptionsParams = {
  connectionId?: string;
  enabled?: boolean;
  pageSize?: number;
  searchTerm?: string;
};

const DEFAULT_PAGE_SIZE = 30;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const mapContactSnapshot = (snapshot: QueryDocumentSnapshot[]) =>
  snapshot.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Contact[];

export function useContactsOptions({
  connectionId,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  searchTerm = "",
}: UseContactsOptionsParams = {}) {
  const { user } = useAuth();
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);
  const queryKey = [user?.uid ?? "", connectionId ?? "all", normalizedSearchTerm].join(
    ":",
  );
  const paginationQueryKey = [queryKey, pageSize, canLoad].join(":");
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [paginationState, setPaginationState] = useState({
    queryKey: paginationQueryKey,
    visibleLimit: pageSize,
  });
  const visibleLimit =
    paginationState.queryKey === paginationQueryKey
      ? paginationState.visibleLimit
      : pageSize;
  const previousPaginationQueryKey = useRef(paginationQueryKey);

  useEffect(() => {
    const isNewQuery =
      previousPaginationQueryKey.current !== paginationQueryKey;
    previousPaginationQueryKey.current = paginationQueryKey;

    if (isNewQuery) {
      setPaginationState({
        queryKey: paginationQueryKey,
        visibleLimit: pageSize,
      });
    }

    if (!canLoad || !user) {
      return;
    }

    if (isNewQuery) {
      setIsLoading(true);
      setIsLoadingMore(false);
      setHasMore(false);
      setError("");
    }

    let isActive = true;
    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
    ];

    if (connectionId) {
      constraints.splice(1, 0, where("connectionId", "==", connectionId));
    }

    if (normalizedSearchTerm) {
      constraints.push(
        startAt(normalizedSearchTerm),
        endAt(`${normalizedSearchTerm}\uf8ff`),
      );
    }

    constraints.push(limit(visibleLimit + 1));

    const contactsQuery = query(collection(db, "contacts"), ...constraints);

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        if (!isActive) return;

        const contactsData = mapContactSnapshot(snapshot.docs.slice(0, visibleLimit));

        setContacts(contactsData);
        setHasMore(snapshot.docs.length > visibleLimit);
        setIsLoading(false);
        setIsLoadingMore(false);
        setError("");
      },
      (error) => {
        if (!isActive) return;

        setError(getFirestoreErrorMessage(error, "contatos"));
        setIsLoading(false);
        setIsLoadingMore(false);
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [
    canLoad,
    connectionId,
    normalizedSearchTerm,
    pageSize,
    paginationQueryKey,
    queryKey,
    user,
    visibleLimit,
  ]);

  const loadMore = useCallback(() => {
    if (!canLoad || !hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    setPaginationState((currentState) => ({
      queryKey: paginationQueryKey,
      visibleLimit:
        (currentState.queryKey === paginationQueryKey
          ? currentState.visibleLimit
          : pageSize) + pageSize,
    }));
  }, [canLoad, hasMore, isLoadingMore, pageSize, paginationQueryKey]);

  return {
    contacts: canLoad ? contacts : [],
    error: canLoad ? error : "",
    hasMore: canLoad ? hasMore : false,
    isLoading: canLoad ? isLoading : false,
    isLoadingMore,
    loadMore,
  };
}
