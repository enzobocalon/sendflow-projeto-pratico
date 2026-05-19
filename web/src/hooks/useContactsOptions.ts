import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import type { Contact } from "../features/contacts/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

type UseContactsOptionsParams = {
  connectionId?: string;
  enabled?: boolean;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 30;

const getFirestoreErrorMessage = (error: { code?: string }) => {
  if (error.code === "failed-precondition") {
    return "A consulta precisa de um índice do Firestore. Aguarde a criação do índice ou faça o deploy dos índices.";
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
}: UseContactsOptionsParams = {}) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [pagination, setPagination] = useState({
    limit: pageSize,
    queryKey: "",
  });
  const queryKey = [user?.uid ?? "", connectionId ?? "all"].join(":");
  const visibleLimit =
    pagination.queryKey === queryKey ? pagination.limit : pageSize;
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
    }

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy("name", "asc"),
      limit(visibleLimit + 1),
    ];

    if (connectionId) {
      constraints.splice(1, 0, where("connectionId", "==", connectionId));
    }

    const contactsQuery = query(
      collection(db, "contacts"),
      ...constraints,
    );

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        const contactsData: Contact[] = snapshot.docs
          .slice(0, visibleLimit)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Contact[];

        setContacts(contactsData);
        setHasMore(snapshot.docs.length > visibleLimit);
        setLoadedQueryKey(queryKey);
        setIsLoading(false);
        setError("");
      },
      (error) => {
        setLoadedQueryKey(queryKey);
        setError(getFirestoreErrorMessage(error));
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canLoad, connectionId, queryKey, user, visibleLimit]);

  const loadMore = useCallback(() => {
    setPagination((currentPagination) => ({
      limit:
        currentPagination.queryKey === queryKey
          ? currentPagination.limit + pageSize
          : pageSize,
      queryKey,
    }));
  }, [pageSize, queryKey]);

  return {
    contacts: canLoad && loadedQueryKey === queryKey ? contacts : [],
    error: canLoad ? error : "",
    hasMore: canLoad && loadedQueryKey === queryKey ? hasMore : false,
    isLoading: canLoad ? isLoading || loadedQueryKey !== queryKey : false,
    loadMore,
  };
}
