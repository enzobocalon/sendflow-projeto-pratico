import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import type { Message, MessageStatus } from "../features/messages/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

type UseMessagesOptionsParams = {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
};

const DEFAULT_PAGE_SIZE = 30;

const getFirestoreErrorMessage = (error: { code?: string }) => {
  if (error.code === "failed-precondition") {
    return "A consulta precisa de um índice do Firestore. Aguarde a criação do índice ou faça o deploy dos índices.";
  }

  if (error.code === "permission-denied") {
    return "Você não tem permissão para carregar estas mensagens.";
  }

  return error.code
    ? `Não foi possível carregar as mensagens. (${error.code})`
    : "Não foi possível carregar as mensagens.";
};

const mapMessageDocuments = (
  documents: Array<{ data: () => unknown; id: string }>,
) =>
  documents.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as Omit<Message, "id">),
      }) as Message,
  );

const getFallbackMessageDate = (message: Message) => {
  const date = message.scheduledAt ?? message.sentAt ?? message.createdAt;

  return date?.toMillis() ?? 0;
};

export function useMessagesOptions({
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  status = "all",
}: UseMessagesOptionsParams = {}) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState({
    limit: pageSize,
    queryKey: "",
  });
  const queryKey = [user?.uid ?? "", status].join(":");
  const visibleLimit =
    pagination.queryKey === queryKey ? pagination.limit : pageSize;
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
    }

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(visibleLimit + 1),
    ];

    if (status !== "all") {
      constraints.splice(1, 0, where("status", "==", status));
    }

    const messagesQuery = query(
      collection(db, "messages"),
      ...constraints,
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = mapMessageDocuments(
          snapshot.docs.slice(0, visibleLimit),
        );

        setMessages(nextMessages);
        setHasMore(snapshot.docs.length > visibleLimit);
        setLoadedQueryKey(queryKey);
        setIsLoading(false);
        setError("");
      },
      async (error) => {
        if (error.code === "failed-precondition") {
          const fallbackConstraints: QueryConstraint[] = [
            where("userId", "==", user.uid),
            limit(visibleLimit + 1),
          ];

          if (status !== "all") {
            fallbackConstraints.splice(1, 0, where("status", "==", status));
          }

          try {
            const snapshot = await getDocs(
              query(collection(db, "messages"), ...fallbackConstraints),
            );
            const nextMessages = mapMessageDocuments(snapshot.docs)
              .sort(
                (current, next) =>
                  getFallbackMessageDate(next) -
                  getFallbackMessageDate(current),
              )
              .slice(0, visibleLimit);

            setMessages(nextMessages);
            setHasMore(snapshot.docs.length > visibleLimit);
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

    return unsubscribe;
  }, [canLoad, queryKey, status, user, visibleLimit]);

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
    error: canLoad ? error : "",
    hasMore: canLoad && loadedQueryKey === queryKey ? hasMore : false,
    isLoading: canLoad ? isLoading || loadedQueryKey !== queryKey : false,
    loadMore,
    messages: canLoad && loadedQueryKey === queryKey ? messages : [],
  };
}
