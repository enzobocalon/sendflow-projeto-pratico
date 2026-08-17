import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import type { ConnectionsState } from "@/features/connections/hooks/use-connections";
import { useFeedback } from "@/providers/feedback/use-feedback";

import { handleSaveContact } from "../contacts.facade";
import type { Contact } from "../contacts.model";
import { contactSchema, type ContactFormValues } from "../contacts.schema";

interface UseContactFormParams {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onSaved: () => void;
}

export function useContactForm(params: UseContactFormParams) {
  const { connectionsState, editingContact, onSaved } = params;
  const { showError, showSuccess } = useFeedback();
  const { connections, isLoading: isLoadingConnections } = connectionsState;

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ContactFormValues>({
    defaultValues: {
      name: "",
      phone: "",
      connectionId: "",
    },
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    reset({
      name: editingContact?.name ?? "",
      phone: editingContact?.phone ?? "",
      connectionId: editingContact?.connectionId ?? "",
    });
  }, [editingContact, reset]);

  const submitContact = handleSubmit(async (values) => {
    try {
      await handleSaveContact({ editingContact, values });
      reset();
      showSuccess(
        editingContact
          ? "Contato atualizado com sucesso."
          : "Contato criado com sucesso.",
      );
      onSaved();
    } catch (saveError) {
      showError(
        getBusinessRuleErrorMessage(
          saveError,
          "Não foi possível salvar o contato.",
        ),
      );
    }
  });

  return {
    state: {
      connections,
      isLoadingConnections,
    },
    form: { control, errors, isSubmitting },
    actions: { submitContact },
  };
}
