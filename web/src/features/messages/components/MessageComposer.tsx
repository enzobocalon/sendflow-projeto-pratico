import { Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { ConnectionSelectField } from "../../../components/ConnectionSelectField";
import { FeedbackSnackbar } from "../../../components/FeedbackSnackbar";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Message } from "../types";
import { MessageComposerActions } from "./MessageComposerActions";
import { MessageContactsField } from "./MessageContactsField";
import { MessageScheduleFields } from "./MessageScheduleFields";
import { useMessageComposer } from "./useMessageComposer";

type MessageComposerProps = {
  editingMessage: Message | null;
  onCancel: () => void;
  onSaved: () => void;
};

export const MessageComposer = ({
  editingMessage,
  onCancel,
  onSaved,
}: MessageComposerProps) => {
  const {
    availableContacts,
    cancelScheduledMode,
    clearFeedback,
    clearSelectedContacts,
    connectionError,
    connections,
    contactSearchTerm,
    contactsCurrentPage,
    contactsError,
    control,
    enableScheduledMode,
    errors,
    formError,
    goToNextContactsPage,
    goToPreviousContactsPage,
    hasNextContactsPage,
    hasPreviousContactsPage,
    isChangingContactsPage,
    isLoadingConnections,
    isLoadingContacts,
    isSubmitting,
    selectedContactsCount,
    selectedConnectionId,
    sendMode,
    setContactSearchTerm,
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
              connectionsError={connectionError}
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
          availableContacts={availableContacts}
          contactIdsError={errors.contactIds?.message}
          contactSearchTerm={contactSearchTerm}
          contactsCurrentPage={contactsCurrentPage}
          contactsError={contactsError}
          control={control}
          hasConnections={hasConnections}
          hasNextContactsPage={hasNextContactsPage}
          hasPreviousContactsPage={hasPreviousContactsPage}
          isChangingContactsPage={isChangingContactsPage}
          isLoadingContacts={isLoadingContacts}
          isSubmitting={isSubmitting}
          onClearSelection={clearSelectedContacts}
          onNextPage={goToNextContactsPage}
          onPreviousPage={goToPreviousContactsPage}
          onSearchTermChange={setContactSearchTerm}
          selectedConnectionId={selectedConnectionId}
          selectedContactsCount={selectedContactsCount}
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
};
