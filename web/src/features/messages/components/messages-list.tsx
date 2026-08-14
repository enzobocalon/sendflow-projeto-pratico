import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/empty-state";
import { FeedbackSnackbar } from "@/components/feedback-snackbar";
import { PaginatedContent } from "@/components/paginated-content";
import { SectionTitle } from "@/features/dashboard/components/section-title";

import { useMessagesList } from "../hooks/use-messages-list";
import type { Message } from "../models/message.model";
import { MessageFilters } from "./message-filters";
import { getMessagesListEmptyState } from "./message-list-copy";

const statusLabel = {
  scheduled: "Agendada",
  sent: "Enviada",
};

const statusColor = {
  scheduled: "warning",
  sent: "success",
} as const;

interface MessagesListProps {
  editingMessage: Message | null;
  onDeletedEditingMessage: () => void;
  onEdit: (message: Message) => void;
}

export function MessagesList(props: MessagesListProps) {
  const { editingMessage, onDeletedEditingMessage, onEdit } = props;

  const { state, actions } = useMessagesList({
    editingMessage,
    onDeletedEditingMessage,
    onEdit,
  });

  const emptyState = getMessagesListEmptyState(state.filter);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle
          title="Histórico de mensagens"
          subtitle="Acompanhe mensagens enviadas e agendadas."
        />
        <MessageFilters
          filter={state.filter}
          onFilterChange={actions.handleFilterChange}
        />
      </div>

      {state.isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando mensagens" />
        </div>
      ) : (
        <PaginatedContent
          contentLabel="mensagens"
          currentPage={state.currentPage}
          disabled={state.isDeleting}
          hasNextPage={state.hasNextPage}
          hasPreviousPage={state.hasPreviousPage}
          isLoading={state.isPageChanging}
          loadingLabel="Carregando mensagens da próxima página"
          onNextPage={actions.goToNextPage}
          onPreviousPage={actions.goToPreviousPage}
        >
          <Stack spacing={1.5}>
            {state.messages.length === 0 && <EmptyState {...emptyState} />}

            {state.messages.map((message) => (
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
                          statusColor[
                            message.status as keyof typeof statusColor
                          ]
                        }
                        label={
                          statusLabel[
                            message.status as keyof typeof statusLabel
                          ]
                        }
                      />
                      <Typography className="text-xs text-slate-500">
                        {message.date} ·{" "}
                        {!message.recipients
                          ? 0
                          : message.recipients <= 1
                            ? `${message.recipients} contato`
                            : `${message.recipients} contatos`}
                      </Typography>
                    </Stack>
                    <Typography className="text-sm text-slate-700">
                      {message.content}
                    </Typography>
                  </div>
                  <IconButton
                    aria-label="Mais ações"
                    size="small"
                    onClick={(event) => actions.openMenu(event, message)}
                    disabled={state.isDeleting || state.isPageChanging}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
          </Stack>
        </PaginatedContent>
      )}

      <Menu
        anchorEl={state.menuAnchor}
        open={Boolean(state.menuAnchor)}
        onClose={actions.closeMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        disableScrollLock
      >
        <MenuItem
          onClick={actions.handleEdit}
          disabled={state.selectedMessage?.status === "sent"}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={actions.handleDelete}>
          <ListItemIcon>
            <DeleteOutlineIcon color="error" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <FeedbackSnackbar
        message={state.feedback?.message ?? ""}
        onClose={actions.clearFeedback}
        severity={state.feedback?.severity ?? "success"}
      />
    </section>
  );
}
