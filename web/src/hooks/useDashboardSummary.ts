import { useEffect, useState } from "react";
import {
  emptyUsageCounters,
  subscribeToUsage,
} from "../features/dashboard/services/usageService";
import { useAuth } from "./useAuth";

const summaryErrorMessage =
  "Não foi possível carregar os dados totais do dashboard.";

const mapSummary = (usage: typeof emptyUsageCounters) => ({
  connections: usage.connectionsCount,
  contacts: usage.contactsCount,
  messages: usage.messagesCount,
  scheduledMessages: usage.scheduledMessagesCount,
});

const emptySummary = mapSummary(emptyUsageCounters);

export const useDashboardSummary = () => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    if (!user) return;

    return subscribeToUsage(
      user.uid,
      (usage) => {
        setSummary(mapSummary(usage));
        setError("");
        setIsLoading(false);
      },
      () => {
        setError(summaryErrorMessage);
        setIsLoading(false);
      },
    );
  }, [user]);

  if (!user) {
    return { error: "", isLoading: false, summary: emptySummary };
  }

  return { error, isLoading, summary };
};
