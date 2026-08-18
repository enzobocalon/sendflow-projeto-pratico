import { normalizeSearchText } from "@sendflow/shared";

import { useAuth } from "@/features/auth/use-auth";
import { useRxValue } from "@/hooks/use-rx-value";

import { getConnections$, type Connection } from "../connections.model";

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
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const userId = enabled ? user?.uid : null;

  const [connections, isLoading] = useRxValue(
    () => getConnections$(normalizedSearchTerm),
    [userId, normalizedSearchTerm],
    [],
  );

  return { connections, isLoading };
}
