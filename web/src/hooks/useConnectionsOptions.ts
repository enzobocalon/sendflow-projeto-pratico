import { useCallback, useEffect, useState } from "react";
import type { Connection } from "../features/connections/types";
import { useAuth } from "./useAuth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

type UseConnectionsOptionsParams = {
  enabled?: boolean;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 30;

const getFirestoreErrorMessage = (error: { code?: string }) => {
  if (error.code === "failed-precondition") {
    return "A consulta precisa de um índice do Firestore. Aguarde a criação do índice ou faça o deploy dos índices.";
  }

  if (error.code === "permission-denied") {
    return "Você não tem permissão para carregar estas conexões.";
  }

  return error.code
    ? `Não foi possível carregar as conexões. (${error.code})`
    : "Não foi possível carregar as conexões.";
};

export function useConnectionsOptions({
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseConnectionsOptionsParams = {}) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [pagination, setPagination] = useState({
    limit: pageSize,
    queryKey: "",
  });
  const queryKey = user ? user.uid : "";
  const visibleLimit =
    pagination.queryKey === queryKey ? pagination.limit : pageSize;
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
    }

    const connectionsQuery = query(
      collection(db, "connections"),
      where("userId", "==", user.uid),
      orderBy("name", "asc"),
      limit(visibleLimit + 1),
    );

    const unsubscribe = onSnapshot(
      connectionsQuery,
      (snapshot) => {
        const nextConnections = snapshot.docs
          .slice(0, visibleLimit)
          .map(
            (document) =>
              ({
                id: document.id,
                ...document.data(),
              }) as Connection,
          );

        setConnections(nextConnections);
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

    return unsubscribe;
  }, [canLoad, queryKey, user, visibleLimit]);

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
    connections: canLoad && loadedQueryKey === queryKey ? connections : [],
    error: canLoad ? error : "",
    hasMore: canLoad && loadedQueryKey === queryKey ? hasMore : false,
    isLoading: canLoad ? isLoading || loadedQueryKey !== queryKey : false,
    loadMore,
  };
}
