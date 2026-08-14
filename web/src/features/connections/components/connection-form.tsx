import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import { Controller } from "react-hook-form";

import { FeedbackSnackbar } from "@/components/feedback-snackbar";
import { SectionTitle } from "@/features/dashboard/components/section-title";

import { useConnectionForm } from "../facades/use-connection-form";
import type { Connection } from "../models/connection.model";

interface ConnectionFormProps {
  connectionsCount: number;
  editingConnection: Connection | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function ConnectionForm(props: ConnectionFormProps) {
  const { connectionsCount, editingConnection, onCancel, onSaved } = props;

  const isEditing = Boolean(editingConnection);
  const { state, form, actions } = useConnectionForm({
    connectionsCount,
    editingConnection,
    onSaved,
  });

  return (
    <section className="rounded-lg border border-slate-200 p-5">
      <SectionTitle
        title={isEditing ? "Editar conexão" : "Cadastro de conexão"}
        subtitle="Crie ou edite uma conexão."
      />

      <Stack
        component="form"
        spacing={2.5}
        className="mt-5"
        onSubmit={actions.submitConnection}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome da conexão"
              placeholder="Ex: WhatsApp Comercial"
              error={Boolean(form.errors.name)}
              helperText={form.errors.name?.message}
              fullWidth
            />
          )}
        />

        {state.hasReachedConnectionsLimit && (
          <Alert severity="warning">
            Limite de {MAX_CONNECTIONS_PER_USER} conexões atingido. Exclua uma
            conexão para cadastrar outra.
          </Alert>
        )}

        <Stack direction="row" spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={form.isSubmitting || state.hasReachedConnectionsLimit}
          >
            {form.isSubmitting ? "Salvando..." : "Salvar conexão"}
          </Button>
          {isEditing && (
            <Button type="button" variant="outlined" onClick={onCancel}>
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
