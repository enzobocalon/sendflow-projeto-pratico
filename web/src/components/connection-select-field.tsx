import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";

import type { Connection } from "@/features/connections/connection.model";
import { getConnectionFieldFeedback } from "@/utils/connection-field-feedback";

import { FormFieldFeedback } from "./form-field-feedback";

type ConnectionField = ControllerRenderProps<FieldValues, "connectionId">;

interface ConnectionSelectFieldProps {
  connections: Connection[];
  emptyMessage: string;
  field: ConnectionField;
  fieldError?: string;
  labelId: string;
  isLoadingConnections: boolean;
  onChange?: (event: SelectChangeEvent<string>) => void;
}

export function ConnectionSelectField(props: ConnectionSelectFieldProps) {
  const {
    connections,
    emptyMessage,
    field,
    fieldError,
    labelId,
    isLoadingConnections,
    onChange,
  } = props;
  const hasConnections = connections.length > 0;
  const feedback = getConnectionFieldFeedback({
    emptyMessage,
    fieldError,
    hasConnections,
    isLoadingConnections,
  });
  const handleChange =
    onChange ?? ((event: SelectChangeEvent<string>) => field.onChange(event));

  return (
    <FormControl fullWidth error={Boolean(fieldError)}>
      <InputLabel id={labelId}>Conexão</InputLabel>

      <Select<string>
        name={field.name}
        value={field.value}
        onBlur={field.onBlur}
        onChange={handleChange}
        inputRef={field.ref}
        labelId={labelId}
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

      <FormFieldFeedback error={feedback.error} message={feedback.message} />
    </FormControl>
  );
}
