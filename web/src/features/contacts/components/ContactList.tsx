import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Contact } from "../types";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { useContactsList } from "./useContactsList";
import { formatPhone } from "../../../utils/formatPhone";

type ContactsListProps = {
  editContact: (contact: Contact) => void;
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
};

export const ContactsList = ({
  editContact,
  editingContact,
  onDeletedEditingContact,
}: ContactsListProps) => {
  const {
    closeDeleteModal,
    confirmDeleteContact,
    contactToDelete,
    contacts,
    error,
    getConnectionName,
    hasMore,
    isDeleting,
    isLoading,
    isLoadingMore,
    loadMore,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts,
  } = useContactsList({
    editingContact,
    onDeletedEditingContact,
  });

  const subtitle =
    totalContacts === 0
      ? searchTerm.trim()
        ? "Nenhum contato encontrado."
        : "Nenhum contato cadastrado."
      : `${totalContacts} contato${totalContacts === 1 ? "" : "s"} cadastrado${totalContacts === 1 ? "" : "s"}.`;

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
        <Stack spacing={1.5}>
          {contacts.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
              <Typography className="font-medium text-slate-800">
                Nenhum contato encontrado
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500">
                {searchTerm.trim()
                  ? "Tente buscar por outro nome."
                  : "Use o cadastro ao lado para vincular contatos a uma conexão antes de enviar mensagens."}
              </Typography>
            </div>
          )}

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
                  {formatPhone(contact.phone)} ·{" "}
                  {contact.connectionName ?? getConnectionName(contact.connectionId)}
                </Typography>
              </div>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  aria-label="Editar contato"
                  size="small"
                  onClick={() => editContact(contact)}
                  color={editingContact?.id === contact.id ? "primary" : "default"}
                  disabled={isDeleting}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Excluir contato"
                  size="small"
                  onClick={() => requestDeleteContact(contact)}
                  disabled={isDeleting}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
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
                {isLoadingMore ? "Carregando..." : "Carregar mais contatos"}
              </Button>
            </div>
          )}
        </Stack>
      )}

      <DeleteDialog
        title="Excluir contato?"
        open={Boolean(contactToDelete)}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteContact}
        isLoading={isDeleting}
        message={`Tem certeza que deseja excluir o contato ${contactToDelete?.name}? Esta ação não pode ser desfeita.`}
      />
    </section>
  );
};
