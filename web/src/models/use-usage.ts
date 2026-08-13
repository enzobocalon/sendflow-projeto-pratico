import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  emptyUsageCounters,
  getUsageRealtime,
  type UsageCounters,
} from "./usage.model";

const usageErrorMessage =
  "Não foi possível carregar os dados totais do dashboard.";

export function useUsage() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [usage, setUsage] = useState<UsageCounters>(emptyUsageCounters);

  useEffect(() => {
    if (!user) return;

    return getUsageRealtime(
      user.uid,
      (loadedUsage) => {
        setUsage(loadedUsage);
        setError("");
        setIsLoading(false);
      },
      () => {
        setError(usageErrorMessage);
        setIsLoading(false);
      },
    );
  }, [user]);

  if (!user) {
    return { error: "", isLoading: false, usage: emptyUsageCounters };
  }

  return { error, isLoading, usage };
}
