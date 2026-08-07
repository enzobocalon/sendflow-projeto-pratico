import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import { Controller } from "react-hook-form";
import type { Contact } from "../types";
import { useContactForm } from "./useContactForm";
import { formatPhone, sanitizePhone } from "../../../utils/formatPhone";

type ContactFormProps = {
  editingContact: Contact | null;
  onCancel: () => void;
  onSaved: () => void;
};

export const ContactForm = ({
  editingContact,
  onCancel,
  onSaved,
}: ContactFormProps) => {
  const isEditing = Boolean(editingContact);
  const {
    connections,
    connectionsError,
    control,
    error,
    errors,
    isLoadingConnections,
    isSubmitting,
    submitContact,
  } = useContactForm({
    editingContact,
    onSaved,
  });
  const hasConnections = connections.length > 0;
  const connectionHelperText =
    errors.connectionId?.message ??
    connectionsError ??
    (!isLoadingConnections && !hasConnections
      ? "Cadastre uma conexão antes de criar contatos."
      : undefined);
  const hasConnectionError = Boolean(errors.connectionId || connectionsError);

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
              onChange={(event) => field.onChange(sanitizePhone(event.target.value))}
              label="Telefone"
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
            <FormControl fullWidth error={Boolean(errors.connectionId)}>
              <InputLabel id="contact-connection-label">Conexão</InputLabel>

              <Select
                {...field}
                labelId="contact-connection-label"
                label="Conexão"
                disabled={isLoadingConnections || !hasConnections}
              >
                {isLoadingConnections && (
                  <MenuItem value="" disabled>
                    Carregando conexões...
                  </MenuItem>
                )}
                {!isLoadingConnections && !hasConnections && (
                  <MenuItem value="" disabled>
                    Nenhuma conexão cadastrada
                  </MenuItem>
                )}
                {connections.map((connection) => (
                  <MenuItem key={connection.id} value={connection.id}>
                    {connection.name}
                  </MenuItem>
                ))}
              </Select>

              {connectionHelperText && (
                <FormHelperText error={hasConnectionError}>
                  {connectionHelperText}
                </FormHelperText>
              )}
            </FormControl>
          )}
        />

        {error && <Alert severity="error">{error}</Alert>}

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
    </section>
  );
};
