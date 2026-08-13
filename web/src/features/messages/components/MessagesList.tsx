import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EmptyState } from "../../../components/EmptyState";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { FeedbackSnackbar } from "../../../components/FeedbackSnackbar";
import { PaginatedContent } from "../../../components/PaginatedContent";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Message } from "../types";
import { MessageFilters } from "./MessageFilters";
import { getMessagesListEmptyState } from "./message-list-copy";
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
    clearDeleteFeedback,
    clearDeleteModal,
    closeDeleteModal,
    confirmDeleteMessage,
    currentPage,
    deleteError,
    deleteSuccess,
    error,
    filter,
    goToNextPage,
    goToPreviousPage,
    handleFilterChange,
    hasNextPage,
    hasPreviousPage,
    isDeleting,
    isDeleteDialogOpen,
    isLoading,
    isPageChanging,
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
  const emptyState = getMessagesListEmptyState(filter);

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
        <PaginatedContent
          contentLabel="mensagens"
          currentPage={currentPage}
          disabled={isDeleting}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          isLoading={isPageChanging}
          loadingLabel="Carregando mensagens da próxima página"
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        >
          <Stack spacing={1.5}>
            {messages.length === 0 && <EmptyState {...emptyState} />}

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
                    onClick={(event) => openMenu(event, message)}
                    disabled={isDeleting || isPageChanging}
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
        open={isDeleteDialogOpen}
        onClose={closeDeleteModal}
        onExited={clearDeleteModal}
        onConfirm={confirmDeleteMessage}
        isLoading={isDeleting}
        message={`Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.`}
      />

      <FeedbackSnackbar
        message={deleteSuccess || deleteError}
        onClose={clearDeleteFeedback}
        severity={deleteSuccess ? "success" : "error"}
      />
    </section>
  );
};
