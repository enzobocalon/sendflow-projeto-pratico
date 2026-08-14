import type { UsageCounters } from "@/features/usage/usage.model";
import { useUsage } from "@/features/usage/use-usage";

const mapSummary = (usage: UsageCounters) => ({
  connections: usage.connectionsCount,
  contacts: usage.contactsCount,
  messages: usage.messagesCount,
  scheduledMessages: usage.scheduledMessagesCount,
});

export function useDashboardSummary() {
  const { isLoading, usage } = useUsage();

  return { isLoading, summary: mapSummary(usage) };
}
