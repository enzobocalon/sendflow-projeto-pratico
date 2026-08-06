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

const filterContacts = ({
  contacts,
  connectionId,
  normalizedSearchTerm,
  visibleLimit,
}: {
  contacts: Contact[];
  connectionId?: string;
  normalizedSearchTerm: string;
  visibleLimit: number;
}) =>
  contacts
    .filter((contact) => (connectionId ? contact.connectionId === connectionId : true))
    .filter((contact) =>
      normalizedSearchTerm
        ? contact.name.toLowerCase().startsWith(normalizedSearchTerm)
        : true,
    )
    .sort((current, next) => current.name.localeCompare(next.name))
    .slice(0, visibleLimit);

const getFirestoreErrorMessage = (error: { code?: string }) => {
  if (error.code === "failed-precondition") {
    return "Não foi possível carregar os contatos porque um índice do Firestore ainda está sendo preparado.";
  }

  if (error.code === "permission-denied") {
    return "Você não tem permissão para carregar estes contatos.";
  }

  return error.code
    ? `Não foi possível carregar os contatos. (${error.code})`
    : "Não foi possível carregar os contatos.";
};

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
    let unsubscribeFallback: (() => void) | undefined;

    const handleFallbackError = (error: { code?: string }) => {
      if (!isActive) return;

      setError(getFirestoreErrorMessage(error));
      setIsLoading(false);
      setIsLoadingMore(false);
    };

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
        const contactsData = mapContactSnapshot(snapshot.docs.slice(0, visibleLimit));

        setContacts(contactsData);
        setHasMore(snapshot.docs.length > visibleLimit);
        setIsLoading(false);
        setIsLoadingMore(false);
        setError("");
      },
      (error) => {
        if (!isActive) return;

        if (error.code === "failed-precondition") {
          unsubscribeFallback = onSnapshot(
            query(collection(db, "contacts"), where("userId", "==", user.uid)),
            (snapshot) => {
              if (!isActive) return;

              const nextContacts = filterContacts({
                contacts: mapContactSnapshot(snapshot.docs),
                connectionId,
                normalizedSearchTerm,
                visibleLimit,
              });

              setContacts(nextContacts);
              setHasMore(false);
              setIsLoading(false);
              setIsLoadingMore(false);
              setError("");
            },
            handleFallbackError,
          );
          return;
        }

        setError(getFirestoreErrorMessage(error));
        setIsLoading(false);
        setIsLoadingMore(false);
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
      unsubscribeFallback?.();
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
