import type { ReactElement } from "react";

export type DashboardTab = "connections" | "contacts" | "messages";

export interface DashboardSummary {
  connections: number;
  contacts: number;
  messages: number;
  scheduledMessages: number;
}

export interface DashboardTabDefinition {
  icon: ReactElement;
  label: string;
  value: DashboardTab;
}
