import type { ReactElement } from "react";

export type DashboardTab = "connections" | "contacts" | "messages";

export interface DashboardTabDefinition {
  icon: ReactElement;
  label: string;
  value: DashboardTab;
}
