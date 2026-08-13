import EventIcon from "@mui/icons-material/Event";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useDashboardSummary } from "../../../hooks/useDashboardSummary";

const summaryItems = [
  { icon: GroupsOutlinedIcon, label: "Conexões", key: "connections" },
  { icon: PhoneOutlinedIcon, label: "Contatos", key: "contacts" },
  { icon: MailOutlineIcon, label: "Mensagens", key: "messages" },
  { icon: EventIcon, label: "Agendadas", key: "scheduledMessages" },
] as const;

export const WorkflowSummary = () => {
  const { error, isLoading, summary } = useDashboardSummary();

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          const value = summary[item.key];

          return (
            <Paper
              key={item.label}
              elevation={0}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon fontSize="small" />
                </span>
                <div>
                  {isLoading ? (
                    <Skeleton width={36} height={32} />
                  ) : (
                    <Typography className="text-2xl font-semibold text-slate-950">
                      {value}
                    </Typography>
                  )}
                  <Typography className="text-sm text-slate-500">
                    {item.label}
                  </Typography>
                </div>
              </div>
            </Paper>
          );
        })}
      </div>
    </>
  );
};
