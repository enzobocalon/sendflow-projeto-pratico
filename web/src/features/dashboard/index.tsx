import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";
import { ContactsPage } from "../contacts";
import { ConnectionsPage } from "../connections";
import { MessagesPage } from "../messages";
import { PageHeader } from "./components/page-header";
import { WorkflowSummary } from "./components/workflow-summary";
import type { DashboardTab, DashboardTabDefinition } from "./types";

const tabs: DashboardTabDefinition[] = [
  { icon: <GroupsOutlinedIcon />, label: "Conexões", value: "connections" },
  { icon: <PhoneOutlinedIcon />, label: "Contatos", value: "contacts" },
  { icon: <MailOutlineIcon />, label: "Mensagens", value: "messages" },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("connections");

  const changeTab = (_event: unknown, value: DashboardTab) => {
    setActiveTab(value);
  };

  return (
    <Stack spacing={3}>
      <PageHeader />
      <WorkflowSummary />

      <Paper
        elevation={0}
        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <Tabs
          aria-label="Seções do dashboard"
          value={activeTab}
          onChange={changeTab}
          variant="scrollable"
          scrollButtons="auto"
          className="border-b border-slate-200 px-2"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>

        <div className="p-5">
          {activeTab === "connections" && <ConnectionsPage />}
          {activeTab === "contacts" && <ContactsPage />}
          {activeTab === "messages" && <MessagesPage />}
        </div>
      </Paper>
    </Stack>
  );
}
