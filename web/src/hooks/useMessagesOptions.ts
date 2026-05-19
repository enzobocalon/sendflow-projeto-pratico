import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
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
    return "Não foi possível carregar as mensagens porque um índice do Firestore ainda está sendo preparado.";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDocument, setLastDocument] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const queryKey = [user?.uid ?? "", status].join(":");
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) {
      return;
    }

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(pageSize + 1),
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
          snapshot.docs.slice(0, pageSize),
        );

        setMessages(nextMessages);
        setHasMore(snapshot.docs.length > pageSize);
        setLastDocument(snapshot.docs.slice(0, pageSize).at(-1) ?? null);
        setLoadedQueryKey(queryKey);
        setIsLoading(false);
        setError("");
      },
      async (error) => {
        if (error.code === "failed-precondition") {
          const fallbackConstraints: QueryConstraint[] = [
            where("userId", "==", user.uid),
            limit(pageSize + 1),
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
              .slice(0, pageSize);

            setMessages(nextMessages);
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

    return unsubscribe;
  }, [canLoad, pageSize, queryKey, status, user]);

  const loadMore = useCallback(async () => {
    if (!canLoad || !user || !lastDocument || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    ];

    if (status !== "all") {
      constraints.splice(1, 0, where("status", "==", status));
    }

    constraints.push(startAfter(lastDocument), limit(pageSize + 1));

    try {
      const snapshot = await getDocs(
        query(collection(db, "messages"), ...constraints),
      );
      const nextMessages = mapMessageDocuments(
        snapshot.docs.slice(0, pageSize),
      );

      setMessages((currentMessages) => [...currentMessages, ...nextMessages]);
      setHasMore(snapshot.docs.length > pageSize);
      setLastDocument(snapshot.docs.slice(0, pageSize).at(-1) ?? null);
      setError("");
    } catch (error) {
      setError(getFirestoreErrorMessage(error as { code?: string }));
    } finally {
      setIsLoadingMore(false);
    }
  }, [canLoad, isLoadingMore, lastDocument, pageSize, status, user]);

  return {
    error: canLoad ? error : "",
    hasMore: canLoad ? hasMore : false,
    isLoading: canLoad ? isLoading && !loadedQueryKey : false,
    isLoadingMore,
    loadMore,
    messages: canLoad ? messages : [],
  };
}
