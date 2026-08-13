import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/empty-state";
import { FeedbackSnackbar } from "@/components/feedback-snackbar";
import { PaginatedContent } from "@/components/paginated-content";
import type { ConnectionsState } from "@/features/connections/models/use-connections";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { formatPhone } from "@/utils/format-phone";

import { useContactsList } from "../facades/use-contacts-list";
import type { Contact } from "../models/contact.model";
import {
  getContactsListEmptyState,
  getContactsListSubtitle,
} from "./contact-list-copy";

interface ContactsListProps {
  connectionsState: ConnectionsState;
  editContact: (contact: Contact) => void;
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
}

export function ContactsList(props: ContactsListProps) {
  const {
    connectionsState,
    editContact,
    editingContact,
    onDeletedEditingContact,
  } = props;
  const {
    clearDeleteFeedback,
    contacts,
    currentPage,
    deleteError,
    deleteSuccess,
    error,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isDeleting,
    isLoading,
    isPageChanging,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts,
  } = useContactsList({
    connectionsState,
    editingContact,
    onDeletedEditingContact,
  });

  const hasSearch = Boolean(searchTerm.trim());
  const subtitle = getContactsListSubtitle(totalContacts, hasSearch);
  const emptyState = getContactsListEmptyState(hasSearch);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle title="Lista de contatos" subtitle={subtitle} />
        <TextField
          size="small"
          label="Buscar contato"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          disabled={isDeleting}
          className="md:w-52"
        />
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando contatos" />
        </div>
      ) : (
        <PaginatedContent
          contentLabel="contatos"
          currentPage={currentPage}
          disabled={isDeleting}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          isLoading={isPageChanging}
          loadingLabel="Carregando contatos da próxima página"
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        >
          <Stack spacing={1.5}>
            {contacts.length === 0 && <EmptyState {...emptyState} />}

            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <Typography className="font-medium text-slate-900">
                    {contact.name}
                  </Typography>
                  <Typography className="text-sm text-slate-500">
                    {formatPhone(contact.phone)} · {contact.connectionName}
                  </Typography>
                </div>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="Editar contato"
                    size="small"
                    onClick={() => editContact(contact)}
                    color={
                      editingContact?.id === contact.id ? "primary" : "default"
                    }
                    disabled={isDeleting || isPageChanging}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Excluir contato"
                    size="small"
                    onClick={() => requestDeleteContact(contact)}
                    disabled={isDeleting || isPageChanging}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </div>
            ))}
          </Stack>
        </PaginatedContent>
      )}

      <FeedbackSnackbar
        message={deleteSuccess || deleteError}
        onClose={clearDeleteFeedback}
        severity={deleteSuccess ? "success" : "error"}
      />
    </section>
  );
}
