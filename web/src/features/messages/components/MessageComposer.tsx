import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
    clearSelectedContacts,
    connectionError,
    connections,
    contactsError,
    control,
    enableScheduledMode,
    errors,
    formError,
    isLoadingConnections,
    isLoadingContacts,
    isSubmitting,
    sendMode,
    submitNow,
    submitScheduled,
  } = useMessageComposer({
    editingMessage,
    onSaved,
  });
  const isEditing = Boolean(editingMessage);
  const hasConnections = connections.length > 0;
  const hasContacts = availableContacts.length > 0;

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
            <FormControl fullWidth error={Boolean(errors.connectionId)}>
              <InputLabel id="message-connection-label">Conexão</InputLabel>

              <Select
                {...field}
                onChange={(event) => {
                  field.onChange(event);
                  clearSelectedContacts();
                }}
                labelId="message-connection-label"
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

              {errors.connectionId && (
                <FormHelperText>{errors.connectionId.message}</FormHelperText>
              )}
              {!errors.connectionId && connectionError && (
                <FormHelperText error>{connectionError}</FormHelperText>
              )}
              {!errors.connectionId &&
                !connectionError &&
                !isLoadingConnections &&
                !hasConnections && (
                  <FormHelperText>
                    Cadastre uma conexão antes de preparar mensagens.
                  </FormHelperText>
                )}
            </FormControl>
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
          <Typography className="mb-2 text-sm font-semibold text-slate-700">
            Selecionar contatos
          </Typography>
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
                      Selecione uma conexão com contatos cadastrados.
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
                </div>

                {errors.contactIds && (
                  <FormHelperText error>
                    {errors.contactIds.message}
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

        {formError && <Alert severity="error">{formError}</Alert>}

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
            disabled={isSubmitting || isLoadingConnections || !hasConnections}
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
              disabled={isSubmitting || isLoadingConnections || !hasConnections}
              onClick={submitScheduled}
            >
              {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          ) : (
            <Button
              variant="outlined"
              type="button"
              startIcon={<EventIcon />}
              disabled={isSubmitting || isLoadingConnections || !hasConnections}
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
    </section>
  );
};
