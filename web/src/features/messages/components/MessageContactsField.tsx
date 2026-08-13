import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { type Control, useController, useFormState } from "react-hook-form";
import { FormFieldFeedback } from "../../../components/FormFieldFeedback";
import { PaginatedContent } from "../../../components/PaginatedContent";
import { useContacts } from "../../contacts/models/useContacts";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatPhone } from "../../../utils/formatPhone";
import type { MessageFormValues } from "../types";

interface MessageContactsFieldProps {
  connectionId: string;
  control: Control<MessageFormValues>;
}

const getEmptyContactsMessage = (
  connectionId: string,
  contactSearchTerm: string,
) => {
  if (!connectionId) {
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

export function MessageContactsField(props: MessageContactsFieldProps) {
  const { connectionId, control } = props;

  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const debouncedContactSearchTerm = useDebouncedValue(contactSearchTerm);
  const { isSubmitting } = useFormState({ control });
  const {
    field: contactIdsField,
    fieldState: { error: contactIdsError },
  } = useController({ control, name: "contactIds" });
  const {
    contacts,
    currentPage,
    error: contactsError,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
  } = useContacts({
    connectionId,
    enabled: Boolean(connectionId),
    searchTerm: debouncedContactSearchTerm,
  });
  const hasContacts = contacts.length > 0;
  const selectedContactsCount = contactIdsField.value.length;
  const hasSelectedContacts = selectedContactsCount > 0;
  const clearSelection = () => {
    contactIdsField.onChange([]);
    setContactSearchTerm("");
  };

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
            onClick={clearSelection}
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
        disabled={!connectionId || isSubmitting}
        fullWidth
        className="mb-3"
      />

      <div className="mt-4">
        <PaginatedContent
          contentLabel="contatos disponíveis"
          currentPage={currentPage}
          disabled={isSubmitting || isLoading}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          isLoading={isPageChanging}
          loadingLabel="Carregando contatos da próxima página"
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          size="small"
        >
          <div className="grid gap-1">
            {isLoading && (
              <Typography className="text-sm text-slate-500">
                Carregando contatos...
              </Typography>
            )}

            {!isLoading && !hasContacts && (
              <Typography className="text-sm text-slate-500">
                {getEmptyContactsMessage(connectionId, contactSearchTerm)}
              </Typography>
            )}

            {contacts.map((contact) => (
              <FormControlLabel
                key={contact.id}
                control={
                  <Checkbox
                    checked={contactIdsField.value.includes(contact.id)}
                    onChange={(event) => {
                      const nextValue = event.target.checked
                        ? [...contactIdsField.value, contact.id]
                        : contactIdsField.value.filter(
                            (contactId) => contactId !== contact.id,
                          );

                      contactIdsField.onChange(nextValue);
                    }}
                    disabled={isSubmitting || isPageChanging}
                  />
                }
                label={`${contact.name} · ${formatPhone(contact.phone)}`}
              />
            ))}
          </div>
        </PaginatedContent>

        <FormFieldFeedback error message={contactIdsError?.message} />
        {!contactIdsError && hasContacts && !hasSelectedContacts && (
          <FormFieldFeedback message="Selecione pelo menos um contato para enviar ou agendar." />
        )}
        {!contactIdsError && (
          <FormFieldFeedback error message={contactsError} />
        )}
      </div>
    </div>
  );
}
