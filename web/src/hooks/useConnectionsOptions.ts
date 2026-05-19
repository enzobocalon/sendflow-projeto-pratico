import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  endAt,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Connection } from "../features/connections/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const MAX_CONNECTIONS = 100;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

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
        setConnections(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Connection,
          ),
        );
        setError("");
        setIsLoading(false);
      },
      async (firestoreError) => {
        if (firestoreError.code === "failed-precondition") {
          try {
            const snapshot = await getDocs(
              query(
                collection(db, "connections"),
                where("userId", "==", user.uid),
                limit(MAX_CONNECTIONS),
              ),
            );
            const nextConnections = snapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }) as Connection)
              .filter(
                (c) =>
                  !normalizedSearchTerm ||
                  c.name.toLowerCase().startsWith(normalizedSearchTerm),
              )
              .sort((a, b) => a.name.localeCompare(b.name));

            setConnections(nextConnections);
            setError("");
            setIsLoading(false);
            return;
          } catch {
            //
          }
        }

        setError(getFirestoreErrorMessage(firestoreError.code));
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [canLoad, normalizedSearchTerm, user]);

  if (!canLoad) return { connections: [], error: "", isLoading: false };

  return { connections, error, isLoading };
}
