import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { ConnectionsState } from "@/features/connections/models/use-connections";
import { getFirebaseErrorMessage } from "@/utils/firebase-error";
import { getFeedback } from "@/utils/feedback";

import {
  createContact,
  upsertContact,
  type Contact,
} from "../models/contact.model";
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

  const submitContact = handleSubmit(async ({ connectionId, name, phone }) => {
    setSuccess("");

    setError("");

    try {
      if (editingContact) {
        await upsertContact({
          contactId: editingContact.id,
          connectionId,
          name,
          phone,
        });
      } else {
        await createContact({
          connectionId,
          name,
          phone,
        });
      }

      reset();
      setSuccess(
        editingContact
          ? "Contato atualizado com sucesso."
          : "Contato criado com sucesso.",
      );
      onSaved();
    } catch (error) {
      setError(
        getFirebaseErrorMessage(error, "Não foi possível salvar o contato."),
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
