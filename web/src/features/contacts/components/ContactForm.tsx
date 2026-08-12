import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Button, CircularProgress, Stack, TextField } from "@mui/material";
import { FeedbackSnackbar } from "../../../components/FeedbackSnackbar";
import { Controller } from "react-hook-form";
import { ConnectionSelectField } from "../../../components/ConnectionSelectField";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Contact } from "../types";
import type { ConnectionsState } from "../../connections/types";
import { useContactForm } from "./useContactForm";
import { formatPhone, normalizePhoneInput } from "../../../utils/formatPhone";

type ContactFormProps = {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onCancel: () => void;
  onSaved: () => void;
};

export const ContactForm = ({
  connectionsState,
  editingContact,
  onCancel,
  onSaved,
}: ContactFormProps) => {
  const isEditing = Boolean(editingContact);
  const {
    clearFeedback,
    connections,
    connectionsError,
    control,
    error,
    errors,
    isLoadingConnections,
    isSubmitting,
    success,
    submitContact,
  } = useContactForm({
    connectionsState,
    editingContact,
    onSaved,
  });
  const hasConnections = connections.length > 0;

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
        onSubmit={submitContact}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome"
              placeholder="Nome do contato"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={formatPhone(field.value)}
              onChange={(event) =>
                field.onChange(normalizePhoneInput(event.target.value))
              }
              label="Telefone"
              type="tel"
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
              placeholder="(00) 00000-0000"
              fullWidth
            />
          )}
        />
        <Controller
          name="connectionId"
          control={control}
          render={({ field }) => (
            <ConnectionSelectField
              connections={connections}
              connectionsError={connectionsError}
              emptyMessage="Cadastre uma conexão antes de criar contatos."
              field={field}
              fieldError={errors.connectionId?.message}
              labelId="contact-connection-label"
              isLoadingConnections={isLoadingConnections}
            />
          )}
        />

        <Stack direction="row" spacing={1.5} className="flex-wrap">
          <Button
            variant="contained"
            type="submit"
            startIcon={
              isSubmitting ? (
                <CircularProgress color="inherit" size={18} />
              ) : isEditing ? (
                <SaveOutlinedIcon />
              ) : (
                <AddIcon />
              )
            }
            disabled={isSubmitting || isLoadingConnections || !hasConnections}
          >
            {isSubmitting
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
        </Stack>
      </Stack>

      <FeedbackSnackbar
        message={success || error}
        onClose={clearFeedback}
        severity={success ? "success" : "error"}
      />
    </section>
  );
};
