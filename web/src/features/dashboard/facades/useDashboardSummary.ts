import { useUsage } from "../../../models/useUsage";
import { emptyUsageCounters } from "../../../models/usageModel";

const mapSummary = (usage: typeof emptyUsageCounters) => ({
  connections: usage.connectionsCount,
  contacts: usage.contactsCount,
  messages: usage.messagesCount,
  scheduledMessages: usage.scheduledMessagesCount,
});

export function useDashboardSummary() {
  const { error, isLoading, usage } = useUsage();

  return { error, isLoading, summary: mapSummary(usage) };
}
