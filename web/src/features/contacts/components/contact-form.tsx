import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Controller } from "react-hook-form";

import { ConnectionSelectField } from "@/components/connection-select-field";
import { FeedbackSnackbar } from "@/components/feedback-snackbar";
import type { ConnectionsState } from "@/features/connections/hooks/use-connections";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { formatPhone, normalizePhoneInput } from "@/utils/format-phone";

import { useContactForm } from "../hooks/use-contact-form";
import type { Contact } from "../contact.model";

interface ContactFormProps {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function ContactForm(props: ContactFormProps) {
  const { connectionsState, editingContact, onCancel, onSaved } = props;

  const isEditing = Boolean(editingContact);
  const { state, form, actions } = useContactForm({
    connectionsState,
    editingContact,
    onSaved,
  });

  const hasConnections = state.connections.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 p-5">
      <SectionTitle
        title={isEditing ? "Editar contato" : "Cadastro de contato"}
        subtitle={
          isEditing
            ? "Atualize os dados do contato selecionado."
            : "Preencha o nome, telefone e selecione a conexão para cadastrar um novo contato."
        }
      />

      <Stack
        spacing={2.5}
        className="mt-5"
        component="form"
        onSubmit={actions.submitContact}
      >
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome"
              placeholder="Nome do contato"
              error={Boolean(form.errors.name)}
              helperText={form.errors.name?.message}
              fullWidth
            />
          )}
        />
        <Controller
          name="phone"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              value={formatPhone(field.value)}
              onChange={(event) =>
                field.onChange(normalizePhoneInput(event.target.value))
              }
              label="Telefone"
              type="tel"
              error={Boolean(form.errors.phone)}
              helperText={form.errors.phone?.message}
              placeholder="(00) 00000-0000"
              fullWidth
            />
          )}
        />
        <Controller
          name="connectionId"
          control={form.control}
          render={({ field }) => (
            <ConnectionSelectField
              connections={state.connections}
              emptyMessage="Cadastre uma conexão antes de criar contatos."
              field={field}
              fieldError={form.errors.connectionId?.message}
              labelId="contact-connection-label"
              isLoadingConnections={state.isLoadingConnections}
            />
          )}
        />

        <Stack direction="row" spacing={1.5} className="flex-wrap">
          <Button
            variant="contained"
            type="submit"
            startIcon={
              form.isSubmitting ? (
                <CircularProgress color="inherit" size={18} />
              ) : isEditing ? (
                <SaveOutlinedIcon />
              ) : (
                <AddIcon />
              )
            }
            disabled={
              form.isSubmitting || state.isLoadingConnections || !hasConnections
            }
          >
            {form.isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Salvar contato"}
          </Button>

          {isEditing && (
            <Button
              variant="outlined"
              type="button"
              startIcon={<CloseIcon />}
              onClick={onCancel}
              disabled={form.isSubmitting}
            >
              Cancelar
            </Button>
          )}
        </Stack>
      </Stack>

      <FeedbackSnackbar
        message={state.feedback?.message ?? ""}
        onClose={actions.clearFeedback}
        severity={state.feedback?.severity ?? "success"}
      />
    </section>
  );
}
