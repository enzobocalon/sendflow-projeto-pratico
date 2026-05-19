import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Connection } from "../types";
import { useConnectionForm } from "./useConnectionForm";

type ConnectionFormProps = {
  editingConnection: Connection | null;
  onCancel: () => void;
  onSaved: () => void;
  connectionsCount: number;
};

export const ConnectionForm = ({
  editingConnection,
  onCancel,
  onSaved,
  connectionsCount,
}: ConnectionFormProps) => {
  const isEditing = Boolean(editingConnection);
  const { control, error, errors, isSubmitting, submitConnection } =
    useConnectionForm({
      editingConnection,
      onSaved,
      connectionsCount,
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

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction="row" spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={isSubmitting}
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
    </section>
  );
};
