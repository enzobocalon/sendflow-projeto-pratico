import { useEffect, useState } from "react";
import type { Connection } from "../features/connections/types";
import { subscribeToConnections } from "../features/connections/services/connectionService";
import { getFirestoreErrorMessage } from "../utils/firestoreError";
import { useAuth } from "./useAuth";
import { normalizeSearchText } from "@sendflow/shared";

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
    const handleConnections = (loadedConnections: Connection[]) => {
      if (!isActive) return;

      setConnections(loadedConnections);
      setError("");
      setIsLoading(false);
    };

    const unsubscribe = subscribeToConnections({
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
