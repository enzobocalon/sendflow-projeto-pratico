import { useUsage } from "@/hooks/use-usage";
import { emptyUsageCounters } from "@/models/usage.model";

const mapSummary = (usage: typeof emptyUsageCounters) => ({
  connections: usage.connectionsCount,
  contacts: usage.contactsCount,
  messages: usage.messagesCount,
  scheduledMessages: usage.scheduledMessagesCount,
});

export function useDashboardSummary() {
  const { isLoading, usage } = useUsage();

  return { isLoading, summary: mapSummary(usage) };
}
