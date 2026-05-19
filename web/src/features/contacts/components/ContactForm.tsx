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
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { Contact, ContactFormValues } from "../types";
import type { Connection } from "../../connections/types";

type ContactFormProps = {
  error: string;
  errors: FieldErrors<ContactFormValues>;
  control: Control<ContactFormValues>;
  handleSubmit: () => void;
  connections: Connection[];
  connectionsError: string;
  isLoadingConnections: boolean;
  isSubmitting: boolean;
  editingContact: Contact | null;
  cancelEditContact: () => void;
};

export const ContactForm = ({
  error,
  errors,
  control,
  handleSubmit,
  connections,
  connectionsError,
  isLoadingConnections,
  isSubmitting,
  editingContact,
  cancelEditContact,
}: ContactFormProps) => {
  const isEditing = Boolean(editingContact);
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
        onSubmit={handleSubmit}
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

              {errors.connectionId && (
                <FormHelperText>{errors.connectionId.message}</FormHelperText>
              )}
              {!errors.connectionId && connectionsError && (
                <FormHelperText error>{connectionsError}</FormHelperText>
              )}
              {!errors.connectionId && !connectionsError && !isLoadingConnections && !hasConnections && (
                <FormHelperText>Cadastre uma conexão antes de criar contatos.</FormHelperText>
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
              onClick={cancelEditContact}
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
