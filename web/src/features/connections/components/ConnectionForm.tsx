import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Connection, ConnectionFormValues } from "../types";

type ConnectionFormProps = {
  editingConnection: Connection | null;
  error: string;
  errors: FieldErrors<ConnectionFormValues>;
  control: Control<ConnectionFormValues>;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export const ConnectionForm = ({
  control,
  editingConnection,
  error,
  errors,
  isSubmitting,
  onCancel,
  onSubmit,
}: ConnectionFormProps) => {
  const isEditing = Boolean(editingConnection);

  return (
    <section className="rounded-lg border border-slate-200 p-5">
      <SectionTitle
        title={isEditing ? "Editar conexão" : "Cadastro de conexão"}
        subtitle="Crie ou edite uma conexão."
      />

      <Stack component="form" spacing={2.5} className="mt-5" onSubmit={onSubmit}>
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
          <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={isSubmitting}>
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
