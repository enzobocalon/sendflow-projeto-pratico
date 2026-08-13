import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import type { Connection } from "../features/connections/types";
import { FormFieldFeedback } from "./FormFieldFeedback";
import { getConnectionFieldFeedback } from "../utils/connection-field-feedback";

type ConnectionField = ControllerRenderProps<FieldValues, "connectionId">;

type ConnectionSelectFieldProps = {
  connections: Connection[];
  connectionsError: string;
  emptyMessage: string;
  field: ConnectionField;
  fieldError?: string;
  labelId: string;
  isLoadingConnections: boolean;
  onChange?: (event: SelectChangeEvent<string>) => void;
};

export const ConnectionSelectField = ({
  connections,
  connectionsError,
  emptyMessage,
  field,
  fieldError,
  labelId,
  isLoadingConnections,
  onChange,
}: ConnectionSelectFieldProps) => {
  const hasConnections = connections.length > 0;
  const feedback = getConnectionFieldFeedback({
    connectionsError,
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
};
