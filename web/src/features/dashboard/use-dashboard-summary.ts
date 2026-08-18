import type { UsageCounters } from "@/features/usage/usage.model";
import { useUsage } from "@/features/usage/use-usage";

export interface DashboardSummary {
  connections: number;
  contacts: number;
  messages: number;
  scheduledMessages: number;
}

const mapSummary = (usage: UsageCounters): DashboardSummary => ({
  connections: usage.connectionsCount,
  contacts: usage.contactsCount,
  messages: usage.messagesCount,
  scheduledMessages: usage.scheduledMessagesCount,
});

export function useDashboardSummary() {
  const { isLoading, usage } = useUsage();

  return { isLoading, summary: mapSummary(usage) };
}
