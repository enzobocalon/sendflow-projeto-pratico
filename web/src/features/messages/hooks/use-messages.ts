import type { MessageStatus } from "@sendflow/shared";

import { useAuth } from "@/features/auth/use-auth";
import { useRealtimeCursorPagination } from "@/hooks/use-realtime-cursor-pagination";

import { getMessagesPage$, mapMessageDocument } from "../messages.model";

interface UseMessagesParams {
  enabled?: boolean;
  pageSize?: number;
  status?: MessageStatus | "all";
}

const DEFAULT_PAGE_SIZE = 30;

export function useMessages(params: UseMessagesParams = {}) {
  const {
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    status = "all",
  } = params;
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const canLoad = Boolean(user && enabled);
  const queryKey = [userId, status].join(":");

  const { items: messages, ...pagination } = useRealtimeCursorPagination({
    enabled: canLoad,
    getPage$: (cursor, resultLimit) =>
      getMessagesPage$({ cursor, resultLimit, status }),
    mapDocument: mapMessageDocument,
    pageSize,
    queryKey,
  });

  return { messages, ...pagination };
}
