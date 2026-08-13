import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Controller } from "react-hook-form";

import { ConnectionSelectField } from "@/components/connection-select-field";
import { FeedbackSnackbar } from "@/components/feedback-snackbar";
import { SectionTitle } from "@/features/dashboard/components/section-title";

import { useMessageComposer } from "../facades/use-message-composer";
import type { Message } from "../models/message.model";
import { MessageComposerActions } from "./message-composer-actions";
import { MessageContactsField } from "./message-contacts-field";
import { MessageScheduleFields } from "./message-schedule-fields";

interface MessageComposerProps {
  editingMessage: Message | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function MessageComposer(props: MessageComposerProps) {
  const { editingMessage, onCancel, onSaved } = props;

  const {
    cancelScheduledMode,
    clearFeedback,
    clearSelectedContacts,
    connections,
    control,
    enableScheduledMode,
    errors,
    formError,
    isLoadingConnections,
    isSubmitting,
    selectedContactsCount,
    selectedConnectionId,
    sendMode,
    submitNow,
    submitScheduled,
    success,
  } = useMessageComposer({
    editingMessage,
    onSaved,
  });
  const isEditing = Boolean(editingMessage);
  const hasConnections = connections.length > 0;
  const canChooseSendMode =
    !isLoadingConnections && hasConnections && Boolean(selectedConnectionId);
  const canSubmit = canChooseSendMode && selectedContactsCount > 0;

  return (
    <section className="rounded-lg border border-slate-200 p-5">
      <SectionTitle
        title={isEditing ? "Editar mensagem" : "Preparar mensagem"}
        subtitle={
          isEditing
            ? "Atualize os dados da mensagem selecionada."
            : "Selecione contatos, escreva o conteúdo e escolha envio imediato ou agendado."
        }
      />

      <Stack spacing={2.5} className="mt-5">
        <Controller
          name="connectionId"
          control={control}
          render={({ field }) => (
            <ConnectionSelectField
              connections={connections}
              emptyMessage="Cadastre uma conexão antes de preparar mensagens."
              field={field}
              fieldError={errors.connectionId?.message}
              labelId="message-connection-label"
              isLoadingConnections={isLoadingConnections}
              onChange={(event) => {
                field.onChange(event);
                clearSelectedContacts();
              }}
            />
          )}
        />

        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Mensagem"
              minRows={4}
              multiline
              placeholder="Digite a mensagem para os contatos selecionados"
              error={Boolean(errors.content)}
              helperText={errors.content?.message}
              fullWidth
            />
          )}
        />

        <MessageContactsField
          key={selectedConnectionId}
          connectionId={selectedConnectionId}
          control={control}
        />

        {sendMode === "scheduled" && (
          <MessageScheduleFields
            control={control}
            dateError={errors.scheduledDate?.message}
            disabled={isSubmitting}
            onCancel={cancelScheduledMode}
            timeError={errors.scheduledTime?.message}
          />
        )}

        <MessageComposerActions
          canChooseSendMode={canChooseSendMode}
          canSubmit={canSubmit}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onEnableScheduledMode={enableScheduledMode}
          onSubmitNow={submitNow}
          onSubmitScheduled={submitScheduled}
          sendMode={sendMode}
        />
      </Stack>

      <FeedbackSnackbar
        message={success || formError}
        onClose={clearFeedback}
        severity={success ? "success" : "error"}
      />
    </section>
  );
}
