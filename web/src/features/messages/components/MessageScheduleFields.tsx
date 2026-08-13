import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, type Control } from "react-hook-form";
import type { MessageFormValues } from "../types";

interface MessageScheduleFieldsProps {
  control: Control<MessageFormValues>;
  dateError?: string;
  disabled: boolean;
  onCancel: () => void;
  timeError?: string;
}

export function MessageScheduleFields(props: MessageScheduleFieldsProps) {
  const { control, dateError, disabled, onCancel, timeError } = props;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Typography className="text-sm font-semibold text-slate-700">
          Agendamento
        </Typography>
        <Button
          type="button"
          size="small"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          disabled={disabled}
        >
          Cancelar agendamento
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name="scheduledDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Data do agendamento"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={Boolean(dateError)}
              helperText={dateError}
            />
          )}
        />
        <Controller
          name="scheduledTime"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Horário"
              type="time"
              InputLabelProps={{ shrink: true }}
              error={Boolean(timeError)}
              helperText={timeError}
            />
          )}
        />
      </div>
    </div>
  );
}
