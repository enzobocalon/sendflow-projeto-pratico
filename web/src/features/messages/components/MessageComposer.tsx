import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ConnectionSelectField } from "../../../components/ConnectionSelectField";
import { FeedbackSnackbar } from "../../../components/FeedbackSnackbar";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import { Controller } from "react-hook-form";
import { useMessageComposer } from "./useMessageComposer";
import type { Message } from "../types";
import { formatPhone } from "../../../utils/formatPhone";

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
    contactsError,
    control,
    enableScheduledMode,
    errors,
    formError,
    hasMoreContacts,
    isLoadingConnections,
    isLoadingContacts,
    isSubmitting,
    loadMoreContacts,
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
  const hasContacts = availableContacts.length > 0;
  const hasSelectedContacts = selectedContactsCount > 0;
  const selectedContactsPlural = selectedContactsCount === 1 ? "" : "s";
  const actionDisabled =
    isSubmitting ||
    isLoadingConnections ||
    !hasConnections ||
    !selectedConnectionId ||
    !hasSelectedContacts;

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

        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Typography className="text-sm font-semibold text-slate-700">
                Selecionar contatos
              </Typography>
              <Typography className="text-xs text-slate-500">
                {hasSelectedContacts
                  ? `${selectedContactsCount} contato${selectedContactsPlural} selecionado${selectedContactsPlural}`
                  : "Nenhum contato selecionado"}
              </Typography>
            </div>

            {hasSelectedContacts && (
              <Button
                type="button"
                size="small"
                startIcon={<CloseIcon />}
                onClick={clearSelectedContacts}
                disabled={isSubmitting}
              >
                Limpar seleção
              </Button>
            )}
          </div>
          <TextField
            size="small"
            label="Buscar contato"
            value={contactSearchTerm}
            onChange={(event) => setContactSearchTerm(event.target.value)}
            disabled={!hasConnections || isSubmitting}
            fullWidth
            className="mb-3"
          />
          <Controller
            name="contactIds"
            control={control}
            render={({ field }) => (
              <>
                <div className="grid gap-1">
                  {isLoadingContacts && (
                    <Typography className="text-sm text-slate-500">
                      Carregando contatos...
                    </Typography>
                  )}

                  {!isLoadingContacts && !hasContacts && (
                    <Typography className="text-sm text-slate-500">
                      {selectedConnectionId
                        ? contactSearchTerm.trim()
                          ? "Nenhum contato encontrado para esta busca."
                          : "Esta conexão ainda não possui contatos cadastrados."
                        : "Selecione uma conexão para listar os contatos."}
                    </Typography>
                  )}

                  {availableContacts.map((contact) => (
                    <FormControlLabel
                      key={contact.id}
                      control={
                        <Checkbox
                          checked={field.value.includes(contact.id)}
                          onChange={(event) => {
                            const nextValue = event.target.checked
                              ? [...field.value, contact.id]
                              : field.value.filter(
                                  (contactId) => contactId !== contact.id,
                                );

                            field.onChange(nextValue);
                          }}
                          disabled={isSubmitting}
                        />
                      }
                      label={`${contact.name} · ${formatPhone(contact.phone)}`}
                    />
                  ))}

                  {hasMoreContacts && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        onClick={loadMoreContacts}
                        disabled={isSubmitting}
                      >
                        Carregar mais contatos
                      </Button>
                    </div>
                  )}
                </div>

                {errors.contactIds && (
                  <FormHelperText error>
                    {errors.contactIds.message}
                  </FormHelperText>
                )}
                {!errors.contactIds && hasContacts && field.value.length === 0 && (
                  <FormHelperText>
                    Selecione pelo menos um contato para enviar ou agendar.
                  </FormHelperText>
                )}
                {!errors.contactIds && contactsError && (
                  <FormHelperText error>{contactsError}</FormHelperText>
                )}
              </>
            )}
          />
        </div>

        {sendMode === "scheduled" && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Typography className="text-sm font-semibold text-slate-700">
                Agendamento
              </Typography>
              <Button
                type="button"
                size="small"
                startIcon={<CloseIcon />}
                onClick={cancelScheduledMode}
                disabled={isSubmitting}
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
                    error={Boolean(errors.scheduledDate)}
                    helperText={errors.scheduledDate?.message}
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
                    error={Boolean(errors.scheduledTime)}
                    helperText={errors.scheduledTime?.message}
                  />
                )}
              />
            </div>
          </div>
        )}

        <Stack direction="row" spacing={1.5} className="flex-wrap">
          <Button
            variant="contained"
            type="button"
            startIcon={
              isSubmitting && sendMode === "now" ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <SendOutlinedIcon />
              )
            }
            disabled={actionDisabled}
            onClick={submitNow}
          >
            {isSubmitting && sendMode === "now"
              ? "Enviando..."
              : "Enviar agora"}
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
              disabled={actionDisabled}
              onClick={submitScheduled}
            >
              {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          ) : (
            <Button
              variant="outlined"
              type="button"
              startIcon={<EventIcon />}
              disabled={
                isSubmitting ||
                isLoadingConnections ||
                !hasConnections ||
                !selectedConnectionId
              }
              onClick={enableScheduledMode}
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
      </Stack>

      <FeedbackSnackbar
        message={success || formError}
        onClose={clearFeedback}
        severity={success ? "success" : "error"}
      />
    </section>
  );
};
