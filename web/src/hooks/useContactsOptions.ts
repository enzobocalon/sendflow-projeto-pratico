import {
  collection,
  endAt,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [lastDocument, setLastDocument] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const queryKey = [
    user?.uid ?? "",
    connectionId ?? "all",
    normalizedSearchTerm,
  ].join(":");
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
    }

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

    constraints.push(limit(pageSize + 1));

    const contactsQuery = query(collection(db, "contacts"), ...constraints);

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        const contactsData: Contact[] = snapshot.docs
          .slice(0, pageSize)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Contact[];

        setContacts(contactsData);
        setHasMore(snapshot.docs.length > pageSize);
        setLastDocument(snapshot.docs.slice(0, pageSize).at(-1) ?? null);
        setLoadedQueryKey(queryKey);
        setIsLoading(false);
        setError("");
      },
      async (error) => {
        if (error.code === "failed-precondition") {
          try {
            const snapshot = await getDocs(
              query(
                collection(db, "contacts"),
                where("userId", "==", user.uid),
                limit(pageSize + 1),
              ),
            );
            const contactsData = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Contact[];
            const nextContacts = contactsData
              .filter((contact) =>
                connectionId ? contact.connectionId === connectionId : true,
              )
              .filter((contact) =>
                normalizedSearchTerm
                  ? contact.name.toLowerCase().startsWith(normalizedSearchTerm)
                  : true,
              )
              .sort((current, next) => current.name.localeCompare(next.name))
              .slice(0, pageSize);

            setContacts(nextContacts);
            setHasMore(false);
            setLastDocument(null);
            setLoadedQueryKey(queryKey);
            setIsLoading(false);
            setError("");
            return;
          } catch {
            setLoadedQueryKey(queryKey);
            setError(getFirestoreErrorMessage(error));
            setIsLoading(false);
            return;
          }
        }

        setLoadedQueryKey(queryKey);
        setError(getFirestoreErrorMessage(error));
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canLoad, connectionId, normalizedSearchTerm, pageSize, queryKey, user]);

  const loadMore = useCallback(async () => {
    if (!canLoad || !user || !lastDocument || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
    ];

    if (connectionId) {
      constraints.splice(1, 0, where("connectionId", "==", connectionId));
    }

    if (normalizedSearchTerm) {
      constraints.push(endAt(`${normalizedSearchTerm}\uf8ff`));
    }

    constraints.push(startAfter(lastDocument), limit(pageSize + 1));

    try {
      const snapshot = await getDocs(
        query(collection(db, "contacts"), ...constraints),
      );
      const nextContacts = snapshot.docs
        .slice(0, pageSize)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contact[];

      setContacts((currentContacts) => [...currentContacts, ...nextContacts]);
      setHasMore(snapshot.docs.length > pageSize);
      setLastDocument(snapshot.docs.slice(0, pageSize).at(-1) ?? null);
      setError("");
    } catch (error) {
      setError(getFirestoreErrorMessage(error as { code?: string }));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    canLoad,
    connectionId,
    isLoadingMore,
    lastDocument,
    normalizedSearchTerm,
    pageSize,
    user,
  ]);

  return {
    contacts: canLoad ? contacts : [],
    error: canLoad ? error : "",
    hasMore: canLoad ? hasMore : false,
    isLoading: canLoad ? isLoading && !loadedQueryKey : false,
    isLoadingMore,
    loadMore,
  };
}
