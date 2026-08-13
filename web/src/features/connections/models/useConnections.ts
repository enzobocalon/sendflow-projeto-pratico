import { normalizeSearchText } from "@sendflow/shared";
import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getFirestoreErrorMessage } from "../../../utils/firestoreError";
import type { Connection } from "../types";
import { getConnectionsRealtime } from "./connectionModel";

interface UseConnectionsParams {
  enabled?: boolean;
  searchTerm?: string;
}

export function useConnections(params: UseConnectionsParams = {}) {
  const { enabled = true, searchTerm = "" } = params;
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) return;

    let isActive = true;
    const handleConnections = (loadedConnections: Connection[]) => {
      if (!isActive) return;

      setConnections(loadedConnections);
      setError("");
      setIsLoading(false);
    };

    const unsubscribe = getConnectionsRealtime({
      onError: (firestoreError) => {
        if (!isActive) return;

        setError(getFirestoreErrorMessage(firestoreError, "conexões"));
        setIsLoading(false);
      },
      onValue: handleConnections,
      searchTerm: normalizedSearchTerm,
      userId: user.uid,
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [canLoad, normalizedSearchTerm, user]);

  if (!canLoad) return { connections: [], error: "", isLoading: false };

  return { connections, error, isLoading };
}
