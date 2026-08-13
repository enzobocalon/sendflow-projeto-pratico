import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import type { MessageFormValues } from "../types";

type MessageComposerActionsProps = {
  canChooseSendMode: boolean;
  canSubmit: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onEnableScheduledMode: () => void;
  onSubmitNow: () => void;
  onSubmitScheduled: () => void | Promise<void>;
  sendMode: MessageFormValues["sendMode"];
};

export function MessageComposerActions({
  canChooseSendMode,
  canSubmit,
  isEditing,
  isSubmitting,
  onCancel,
  onEnableScheduledMode,
  onSubmitNow,
  onSubmitScheduled,
  sendMode,
}: MessageComposerActionsProps) {
  const isSendingNow = isSubmitting && sendMode === "now";

  return (
    <Stack direction="row" spacing={1.5} className="flex-wrap">
      <Button
        variant="contained"
        type="button"
        startIcon={
          isSendingNow ? (
            <CircularProgress color="inherit" size={18} />
          ) : (
            <SendOutlinedIcon />
          )
        }
        disabled={isSubmitting || !canSubmit}
        onClick={onSubmitNow}
      >
        {isSendingNow ? "Enviando..." : "Enviar agora"}
      </Button>

      {sendMode === "scheduled" ? (
        <Button
          variant="outlined"
          type="button"
          startIcon={
            isSubmitting ? (
              <CircularProgress color="inherit" size={18} />
            ) : (
              <EventIcon />
            )
          }
          disabled={isSubmitting || !canSubmit}
          onClick={onSubmitScheduled}
        >
          {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
        </Button>
      ) : (
        <Button
          variant="outlined"
          type="button"
          startIcon={<EventIcon />}
          disabled={isSubmitting || !canChooseSendMode}
          onClick={onEnableScheduledMode}
        >
          Agendar mensagem
        </Button>
      )}

      {isEditing && (
        <Button
          variant="text"
          type="button"
          startIcon={<CloseIcon />}
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancelar edição
        </Button>
      )}
    </Stack>
  );
}
