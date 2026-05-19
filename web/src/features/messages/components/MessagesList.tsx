import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Chip, IconButton, Stack, Typography } from "@mui/material";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import { messages } from "../../dashboard/mockData";
import { MessageFilters } from "./MessageFilters";

const statusLabel = {
  scheduled: "Agendada",
  sent: "Enviada",
};

const statusColor = {
  scheduled: "warning",
  sent: "success",
} as const;

export const MessagesList = () => {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle
          title="Histórico de mensagens"
          subtitle="Acompanhe mensagens enviadas e agendadas."
        />
        <MessageFilters />
      </div>

      <Stack spacing={1.5}>
        {messages.map((message) => (
          <div
            key={message.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  className="mb-2"
                >
                  <Chip
                    size="small"
                    color={
                      statusColor[message.status as keyof typeof statusColor]
                    }
                    label={
                      statusLabel[message.status as keyof typeof statusLabel]
                    }
                  />
                  <Typography className="text-xs text-slate-500">
                    {message.date} · {message.recipients} contatos
                  </Typography>
                </Stack>
                <Typography className="text-sm text-slate-700">
                  {message.content}
                </Typography>
              </div>
              <IconButton aria-label="Mais ações" size="small">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        ))}
      </Stack>
    </section>
  );
};
