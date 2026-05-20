import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Message } from "../types";
import { MessageFilters } from "./MessageFilters";
import { useMessagesList } from "./useMessagesList";

const statusLabel = {
  scheduled: "Agendada",
  sent: "Enviada",
};

const statusColor = {
  scheduled: "warning",
  sent: "success",
} as const;

type MessagesListProps = {
  editingMessage: Message | null;
  onDeletedEditingMessage: () => void;
  onEdit: (message: Message) => void;
};

export const MessagesList = ({
  editingMessage,
  onDeletedEditingMessage,
  onEdit,
}: MessagesListProps) => {
  const {
    closeDeleteModal,
    confirmDeleteMessage,
    error,
    filter,
    handleFilterChange,
    hasMore,
    isDeleting,
    isLoading,
    isLoadingMore,
    loadMore,
    messageToDelete,
    messages,
    handleDelete,
    handleEdit,
    menuAnchor,
    openMenu,
    closeMenu,
    selectedMessage,
  } = useMessagesList({
    editingMessage,
    onDeletedEditingMessage,
    onEdit,
  });
  const emptyMessage =
    filter === "sent"
      ? "Nenhuma mensagem enviada encontrada."
      : filter === "scheduled"
        ? "Nenhuma mensagem agendada encontrada."
        : "Nenhuma mensagem encontrada";
  const emptyDescription =
    filter === "sent"
      ? "Envie uma mensagem para que ela apareça neste filtro."
      : filter === "scheduled"
        ? "Agende uma mensagem para acompanhar os próximos disparos."
        : "Envie ou agende uma mensagem para acompanhar o histórico.";

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle
          title="Histórico de mensagens"
          subtitle="Acompanhe mensagens enviadas e agendadas."
        />
        <MessageFilters filter={filter} onFilterChange={handleFilterChange} />
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando mensagens" />
        </div>
      ) : (
        <Stack spacing={1.5}>
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
              <Typography className="font-medium text-slate-800">
                {emptyMessage}
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500">
                {emptyDescription}
              </Typography>
            </div>
          )}

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
                  onClick={(event) => openMenu(event, message)}
                  disabled={isDeleting}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outlined"
                onClick={loadMore}
                disabled={isDeleting || isLoadingMore}
              >
                {isLoadingMore ? "Carregando..." : "Carregar mais mensagens"}
              </Button>
            </div>
          )}
        </Stack>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        disableScrollLock
      >
        <MenuItem
          onClick={handleEdit}
          disabled={selectedMessage?.status === "sent"}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlineIcon color="error" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteDialog
        title="Excluir mensagem?"
        open={Boolean(messageToDelete)}
        onClose={closeDeleteModal}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteMessage}
        isLoading={isDeleting}
        message={`Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.`}
      />
    </section>
  );
};
