import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  endAt,
  where,
  type QueryConstraint,
  type QuerySnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Connection } from "../features/connections/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const MAX_CONNECTIONS = 100;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const mapConnectionSnapshot = (snapshot: QuerySnapshot): Connection[] =>
  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Connection);

const filterConnections = (connections: Connection[], normalizedSearchTerm: string) =>
  connections
    .filter(
      (connection) =>
        !normalizedSearchTerm ||
        connection.name.toLowerCase().startsWith(normalizedSearchTerm),
    )
    .sort((current, next) => current.name.localeCompare(next.name));

const getFirestoreErrorMessage = (code?: string) => {
  if (code === "failed-precondition")
    return "Não foi possível carregar as conexões porque um índice do Firestore ainda está sendo preparado.";
  if (code === "permission-denied")
    return "Você não tem permissão para carregar estas conexões.";
  return code
    ? `Não foi possível carregar as conexões. (${code})`
    : "Não foi possível carregar as conexões.";
};

type UseConnectionsOptionsParams = {
  enabled?: boolean;
  searchTerm?: string;
};

export function useConnectionsOptions({
  enabled = true,
  searchTerm = "",
}: UseConnectionsOptionsParams = {}) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));

  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) return;

    let isActive = true;
    let unsubscribeFallback: (() => void) | undefined;

    const handleSnapshot = (snapshot: QuerySnapshot) => {
      if (!isActive) return;

      setConnections(mapConnectionSnapshot(snapshot));
      setError("");
      setIsLoading(false);
    };

    const handleFallbackSnapshot = (snapshot: QuerySnapshot) => {
      if (!isActive) return;

      const nextConnections = filterConnections(
        mapConnectionSnapshot(snapshot),
        normalizedSearchTerm,
      );

      setConnections(nextConnections);
      setError("");
      setIsLoading(false);
    };

    const constraints: QueryConstraint[] = [
      where("userId", "==", user.uid),
      orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
    ];

    if (normalizedSearchTerm) {
      constraints.push(
        startAt(normalizedSearchTerm),
        endAt(`${normalizedSearchTerm}\uf8ff`),
      );
    }

    constraints.push(limit(MAX_CONNECTIONS));

    const unsubscribe = onSnapshot(
      query(collection(db, "connections"), ...constraints),
      (snapshot) => {
        handleSnapshot(snapshot);
      },
      (firestoreError) => {
        if (!isActive) return;

        if (firestoreError.code === "failed-precondition") {
          unsubscribeFallback = onSnapshot(
            query(
              collection(db, "connections"),
              where("userId", "==", user.uid),
              limit(MAX_CONNECTIONS),
            ),
            handleFallbackSnapshot,
            (fallbackError) => {
              if (!isActive) return;

              setError(getFirestoreErrorMessage(fallbackError.code));
              setIsLoading(false);
            },
          );
          return;
        }

        setError(getFirestoreErrorMessage(firestoreError.code));
        setIsLoading(false);
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
      unsubscribeFallback?.();
    };
  }, [canLoad, normalizedSearchTerm, user]);

  if (!canLoad) return { connections: [], error: "", isLoading: false };

  return { connections, error, isLoading };
}
