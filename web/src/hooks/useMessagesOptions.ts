import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, MessageStatus } from "../features/messages/types";
import { db } from "../lib/firebase";
import { getFirestoreErrorMessage } from "../utils/firestoreError";
import { useAuth } from "./useAuth";

type UseMessagesOptionsParams = {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
};

const DEFAULT_PAGE_SIZE = 30;

const mapMessageDocuments = (documents: Array<{ data: () => unknown; id: string }>) =>
  documents.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as Omit<Message, "id">),
      }) as Message,
  );

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
  const [messages, setMessages] = useState<Message[]>([]);
  const canLoad = Boolean(user && enabled);
  const queryKey = [user?.uid ?? "", status].join(":");
  const paginationQueryKey = [queryKey, pageSize, canLoad].join(":");
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
      orderBy("createdAt", "desc"),
      limit(visibleLimit + 1),
    ];

    if (status !== "all") {
      constraints.splice(1, 0, where("status", "==", status));
    }

    const messagesQuery = query(collection(db, "messages"), ...constraints);

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = mapMessageDocuments(snapshot.docs.slice(0, visibleLimit));

        setMessages(nextMessages);
        setHasMore(snapshot.docs.length > visibleLimit);
        setIsLoading(false);
        setIsLoadingMore(false);
        setError("");
      },
      (error) => {
        if (!isActive) return;

        setError(getFirestoreErrorMessage(error, "mensagens"));
        setIsLoading(false);
        setIsLoadingMore(false);
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [canLoad, pageSize, paginationQueryKey, queryKey, status, user, visibleLimit]);

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
    error: canLoad ? error : "",
    hasMore: canLoad ? hasMore : false,
    isLoading: canLoad ? isLoading : false,
    isLoadingMore,
    loadMore,
    messages: canLoad ? messages : [],
  };
}
