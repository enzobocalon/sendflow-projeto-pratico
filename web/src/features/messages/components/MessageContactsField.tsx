import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type Control } from "react-hook-form";
import { FormFieldFeedback } from "../../../components/FormFieldFeedback";
import { PaginatedContent } from "../../../components/PaginatedContent";
import { formatPhone } from "../../../utils/formatPhone";
import type { Contact } from "../../contacts/types";
import type { MessageFormValues } from "../types";

type MessageContactsFieldProps = {
  availableContacts: Contact[];
  contactIdsError?: string;
  contactSearchTerm: string;
  contactsCurrentPage: number;
  contactsError: string;
  control: Control<MessageFormValues>;
  hasConnections: boolean;
  hasNextContactsPage: boolean;
  hasPreviousContactsPage: boolean;
  isChangingContactsPage: boolean;
  isLoadingContacts: boolean;
  isSubmitting: boolean;
  onClearSelection: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSearchTermChange: (searchTerm: string) => void;
  selectedConnectionId: string;
  selectedContactsCount: number;
};

const getEmptyContactsMessage = (
  selectedConnectionId: string,
  contactSearchTerm: string,
) => {
  if (!selectedConnectionId) {
    return "Selecione uma conexão para listar os contatos.";
  }

  if (contactSearchTerm.trim()) {
    return "Nenhum contato encontrado para esta busca.";
  }

  return "Esta conexão ainda não possui contatos cadastrados.";
};

const getSelectedContactsMessage = (selectedContactsCount: number) => {
  if (selectedContactsCount === 0) {
    return "Nenhum contato selecionado";
  }

  const plural = selectedContactsCount === 1 ? "" : "s";
  return `${selectedContactsCount} contato${plural} selecionado${plural}`;
};

export function MessageContactsField({
  availableContacts,
  contactIdsError,
  contactSearchTerm,
  contactsCurrentPage,
  contactsError,
  control,
  hasConnections,
  hasNextContactsPage,
  hasPreviousContactsPage,
  isChangingContactsPage,
  isLoadingContacts,
  isSubmitting,
  onClearSelection,
  onNextPage,
  onPreviousPage,
  onSearchTermChange,
  selectedConnectionId,
  selectedContactsCount,
}: MessageContactsFieldProps) {
  const hasContacts = availableContacts.length > 0;
  const hasSelectedContacts = selectedContactsCount > 0;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography className="text-sm font-semibold text-slate-700">
            Selecionar contatos
          </Typography>
          <Typography className="text-xs text-slate-500">
            {getSelectedContactsMessage(selectedContactsCount)}
          </Typography>
        </div>

        {hasSelectedContacts && (
          <Button
            type="button"
            size="small"
            startIcon={<CloseIcon />}
            onClick={onClearSelection}
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
        onChange={(event) => onSearchTermChange(event.target.value)}
        disabled={!hasConnections || isSubmitting}
        fullWidth
        className="mb-3"
      />

      <Controller
        name="contactIds"
        control={control}
        render={({ field }) => (
          <>
            <PaginatedContent
              contentLabel="contatos disponíveis"
              currentPage={contactsCurrentPage}
              disabled={isSubmitting || isLoadingContacts}
              hasNextPage={hasNextContactsPage}
              hasPreviousPage={hasPreviousContactsPage}
              isLoading={isChangingContactsPage}
              loadingLabel="Carregando contatos da próxima página"
              onNextPage={onNextPage}
              onPreviousPage={onPreviousPage}
              size="small"
            >
              <div className="grid gap-1">
                {isLoadingContacts && (
                  <Typography className="text-sm text-slate-500">
                    Carregando contatos...
                  </Typography>
                )}

                {!isLoadingContacts && !hasContacts && (
                  <Typography className="text-sm text-slate-500">
                    {getEmptyContactsMessage(
                      selectedConnectionId,
                      contactSearchTerm,
                    )}
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
                        disabled={isSubmitting || isChangingContactsPage}
                      />
                    }
                    label={`${contact.name} · ${formatPhone(contact.phone)}`}
                  />
                ))}
              </div>
            </PaginatedContent>

            <FormFieldFeedback error message={contactIdsError} />
            {!contactIdsError && hasContacts && field.value.length === 0 && (
              <FormFieldFeedback message="Selecione pelo menos um contato para enviar ou agendar." />
            )}
            {!contactIdsError && (
              <FormFieldFeedback error message={contactsError} />
            )}
          </>
        )}
      />
    </div>
  );
}
