import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/use-auth";

import {
  emptyUsageCounters,
  getUsage$,
  type UsageCounters,
} from "./usage.model";

export function useUsage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [usage, setUsage] = useState<UsageCounters>(emptyUsageCounters);

  useEffect(() => {
    if (!user) return;

    const subscription = getUsage$(user.uid).subscribe({
      error: () => {
        setIsLoading(false);
      },
      next: (loadedUsage) => {
        setUsage(loadedUsage);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user]);

  if (!user) {
    return { isLoading: false, usage: emptyUsageCounters };
  }

  return { isLoading, usage };
}
