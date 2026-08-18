import { useAuth } from "@/features/auth/use-auth";
import { useRxValue } from "@/hooks/use-rx-value";

import { emptyUsageCounters, getUsage$ } from "./usage.model";

export function useUsage() {
  const { user } = useAuth();
  const [usage, isLoading] = useRxValue(
    getUsage$,
    [user?.uid],
    emptyUsageCounters,
  );

  return { isLoading, usage };
}
