import { useUsage } from "../../../models/use-usage";
import { emptyUsageCounters } from "../../../models/usage.model";

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
