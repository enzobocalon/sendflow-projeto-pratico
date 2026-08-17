import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Controller } from "react-hook-form";

import { ConnectionSelectField } from "@/components/connection-select-field";
import { SectionTitle } from "@/features/dashboard/components/section-title";

import { useMessageComposer } from "../hooks/use-message-composer";
import type { Message } from "../messages.model";
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

  const { state, form, actions } = useMessageComposer({
    editingMessage,
    onSaved,
  });
  const isEditing = Boolean(editingMessage);
  const hasConnections = state.connections.length > 0;
  const canChooseSendMode =
    !state.isLoadingConnections &&
    hasConnections &&
    Boolean(state.selectedConnectionId);
  const canSubmit = canChooseSendMode && state.selectedContactsCount > 0;

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
          control={form.control}
          render={({ field }) => (
            <ConnectionSelectField
              connections={state.connections}
              emptyMessage="Cadastre uma conexão antes de preparar mensagens."
              field={field}
              fieldError={form.errors.connectionId?.message}
              labelId="message-connection-label"
              isLoadingConnections={state.isLoadingConnections}
              onChange={(event) => {
                field.onChange(event);
                actions.clearSelectedContacts();
              }}
            />
          )}
        />

        <Controller
          name="content"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Mensagem"
              minRows={4}
              multiline
              placeholder="Digite a mensagem para os contatos selecionados"
              error={Boolean(form.errors.content)}
              helperText={form.errors.content?.message}
              fullWidth
            />
          )}
        />

        <MessageContactsField
          key={state.selectedConnectionId}
          connectionId={state.selectedConnectionId}
          control={form.control}
        />

        {state.sendMode === "scheduled" && (
          <MessageScheduleFields
            control={form.control}
            dateError={form.errors.scheduledDate?.message}
            disabled={form.isSubmitting}
            onCancel={actions.cancelScheduledMode}
            timeError={form.errors.scheduledTime?.message}
          />
        )}

        <MessageComposerActions
          canChooseSendMode={canChooseSendMode}
          canSubmit={canSubmit}
          isEditing={isEditing}
          isSubmitting={form.isSubmitting}
          onCancel={onCancel}
          onEnableScheduledMode={actions.enableScheduledMode}
          onSubmitNow={actions.submitNow}
          onSubmitScheduled={actions.submitScheduled}
          sendMode={state.sendMode}
        />
      </Stack>
    </section>
  );
}
