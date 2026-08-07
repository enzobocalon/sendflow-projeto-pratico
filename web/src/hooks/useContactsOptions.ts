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
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [lastDocument, setLastDocument] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const queryKey = [user?.uid ?? "", connectionId ?? "all", normalizedSearchTerm].join(
    ":",
  );
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
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

    constraints.push(limit(pageSize + 1));

    const contactsQuery = query(collection(db, "contacts"), ...constraints);

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        if (!isActive) return;

        const contactsData = mapContactSnapshot(snapshot.docs.slice(0, pageSize));

        setContacts(contactsData);
        setHasMore(snapshot.docs.length > pageSize);
        setLastDocument(snapshot.docs.slice(0, pageSize).at(-1) ?? null);
        setLoadedQueryKey(queryKey);
        setIsLoading(false);
        setError("");
      },
      (error) => {
        if (!isActive) return;

        setLoadedQueryKey(queryKey);
        setError(getFirestoreErrorMessage(error, "contatos"));
        setIsLoading(false);
      },
    );

    return () => {
      isActive = false;
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
      const snapshot = await getDocs(query(collection(db, "contacts"), ...constraints));
      const nextContacts = mapContactSnapshot(snapshot.docs.slice(0, pageSize));

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
