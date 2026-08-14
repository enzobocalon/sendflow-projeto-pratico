import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  
  const { state, actions } = useContactsList({
    connectionsState,
    editingContact,
    onDeletedEditingContact,
  });

  const hasSearch = Boolean(state.searchTerm.trim());
  const subtitle = getContactsListSubtitle(state.totalContacts, hasSearch);
  const emptyState = getContactsListEmptyState(hasSearch);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle title="Lista de contatos" subtitle={subtitle} />
        <TextField
          size="small"
          label="Buscar contato"
          value={state.searchTerm}
          onChange={(event) => actions.setSearchTerm(event.target.value)}
          disabled={state.isDeleting}
          className="md:w-52"
        />
      </div>

      {state.isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando contatos" />
        </div>
      ) : (
        <PaginatedContent
          contentLabel="contatos"
          currentPage={state.currentPage}
          disabled={state.isDeleting}
          hasNextPage={state.hasNextPage}
          hasPreviousPage={state.hasPreviousPage}
          isLoading={state.isPageChanging}
          loadingLabel="Carregando contatos da próxima página"
          onNextPage={actions.goToNextPage}
          onPreviousPage={actions.goToPreviousPage}
        >
          <Stack spacing={1.5}>
            {state.contacts.length === 0 && <EmptyState {...emptyState} />}

            {state.contacts.map((contact) => (
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
                    disabled={state.isDeleting || state.isPageChanging}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Excluir contato"
                    size="small"
                    onClick={() => actions.requestDeleteContact(contact)}
                    disabled={state.isDeleting || state.isPageChanging}
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
        message={state.feedback?.message ?? ""}
        onClose={actions.clearFeedback}
        severity={state.feedback?.severity ?? "success"}
      />
    </section>
  );
}
