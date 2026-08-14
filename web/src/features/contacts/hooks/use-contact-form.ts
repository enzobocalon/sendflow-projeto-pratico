import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import type { ConnectionsState } from "@/features/connections/hooks/use-connections";
import { getFeedback } from "@/utils/feedback";

import { handleSaveContact } from "../facades/contact.facade";
import type { Contact } from "../models/contact.model";
import {
  contactSchema,
  type ContactFormValues,
} from "../schemas/contact.schema";

interface UseContactFormParams {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onSaved: () => void;
}

export function useContactForm(params: UseContactFormParams) {
  const { connectionsState, editingContact, onSaved } = params;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");
    setError("");

    try {
      await handleSaveContact({ editingContact, values });
      reset();
      setSuccess(
        editingContact
          ? "Contato atualizado com sucesso."
          : "Contato criado com sucesso.",
      );
      onSaved();
    } catch (saveError) {
      setError(
        getBusinessRuleErrorMessage(
          saveError,
          "Não foi possível salvar o contato.",
        ),
      );
    }
  });

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  return {
    state: {
      connections,
      feedback: getFeedback(success, error),
      isLoadingConnections,
    },
    form: { control, errors, isSubmitting },
    actions: { clearFeedback, submitContact },
  };
}
