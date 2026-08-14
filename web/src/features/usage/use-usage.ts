import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/use-auth";

import {
  emptyUsageCounters,
  getUsageRealtime,
  type UsageCounters,
} from "./usage.model";

export function useUsage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [usage, setUsage] = useState<UsageCounters>(emptyUsageCounters);

  useEffect(() => {
    if (!user) return;

    return getUsageRealtime(
      user.uid,
      (loadedUsage) => {
        setUsage(loadedUsage);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [user]);

  if (!user) {
    return { isLoading: false, usage: emptyUsageCounters };
  }

  return { isLoading, usage };
}
