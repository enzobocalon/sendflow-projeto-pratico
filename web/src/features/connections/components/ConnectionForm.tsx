import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { FeedbackSnackbar } from "../../../components/FeedbackSnackbar";
import { Controller } from "react-hook-form";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Connection } from "../types";
import { useConnectionForm } from "./useConnectionForm";

type ConnectionFormProps = {
  connectionsCount: number;
  editingConnection: Connection | null;
  onCancel: () => void;
  onSaved: () => void;
};

export const ConnectionForm = ({
  connectionsCount,
  editingConnection,
  onCancel,
  onSaved,
}: ConnectionFormProps) => {
  const isEditing = Boolean(editingConnection);
  const {
    clearFeedback,
    control,
    error,
    errors,
    hasReachedConnectionsLimit,
    isSubmitting,
    success,
    submitConnection,
  } = useConnectionForm({
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
        onSubmit={submitConnection}
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome da conexão"
              placeholder="Ex: WhatsApp Comercial"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />

        {hasReachedConnectionsLimit && (
          <Alert severity="warning">
            Limite de 100 conexões atingido. Exclua uma conexão para cadastrar
            outra.
          </Alert>
        )}

        <Stack direction="row" spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={isSubmitting || hasReachedConnectionsLimit}
          >
            {isSubmitting ? "Salvando..." : "Salvar conexão"}
          </Button>
          {isEditing && (
            <Button type="button" variant="outlined" onClick={onCancel}>
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
