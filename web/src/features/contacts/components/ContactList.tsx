import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Contact } from "../types";

type ContactsListProps = {
  contactToDelete: Contact | null;
  contacts: Contact[];
  editContact: (contact: Contact) => void;
  editingContact: Contact | null;
  error: string;
  getConnectionName: (connectionId: string) => string;
  isDeleting: boolean;
  isLoading: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  onDelete: (contact: Contact) => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
  totalContacts: number;
};

export const ContactsList = ({
  contactToDelete,
  contacts,
  editContact,
  editingContact,
  error,
  getConnectionName,
  isDeleting,
  isLoading,
  onCloseDeleteModal,
  onConfirmDelete,
  onDelete,
  onSearchChange,
  searchTerm,
  totalContacts,
}: ContactsListProps) => {
  const subtitle =
    totalContacts === 0
      ? "Nenhum contato cadastrado."
      : `${totalContacts} contato${totalContacts === 1 ? "" : "s"} cadastrado${totalContacts === 1 ? "" : "s"}.`;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle
          title="Lista de contatos"
          subtitle={subtitle}
        />
        <TextField
          size="small"
          label="Buscar contato"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isLoading}
          className="md:w-52"
        />
      </div>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

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
                Cadastre contatos para enviar mensagens depois.
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
                  {contact.phone} · {getConnectionName(contact.connectionId)}
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
                  onClick={() => onDelete(contact)}
                  disabled={isDeleting}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </div>
          ))}
        </Stack>
      )}

      <Dialog
        open={Boolean(contactToDelete)}
        onClose={onCloseDeleteModal}
        aria-labelledby="delete-contact-title"
        aria-describedby="delete-contact-description"
      >
        <DialogTitle id="delete-contact-title">Excluir contato</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-contact-description">
            Tem certeza que deseja excluir o contato {contactToDelete?.name}? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeleteModal} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress color="inherit" size={18} /> : null
            }
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};
