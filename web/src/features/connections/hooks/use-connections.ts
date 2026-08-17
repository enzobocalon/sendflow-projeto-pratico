import { normalizeSearchText } from "@sendflow/shared";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/use-auth";

import { getConnectionsRealtime, type Connection } from "../connections.model";

interface UseConnectionsParams {
  enabled?: boolean;
  searchTerm?: string;
}

export interface ConnectionsState {
  connections: Connection[];
  isLoading: boolean;
}

export function useConnections(
  params: UseConnectionsParams = {},
): ConnectionsState {
  const { enabled = true, searchTerm = "" } = params;
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(user && enabled));
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const canLoad = Boolean(user && enabled);

  useEffect(() => {
    if (!canLoad || !user) return;

    let isActive = true;
    const handleConnections = (loadedConnections: Connection[]) => {
      if (!isActive) return;

      setConnections(loadedConnections);
      setIsLoading(false);
    };

    const unsubscribe = getConnectionsRealtime({
      onError: () => {
        if (!isActive) return;

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

  if (!canLoad) return { connections: [], isLoading: false };

  return { connections, isLoading };
}
