import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/use-auth";
import { createContact, upsertContact } from "../models/contact.model";
import { getFirebaseErrorMessage } from "../../../utils/firebase-error";
import { contactSchema } from "../schemas/contact.schema";
import type { Contact, ContactFormValues } from "../types";
import type { ConnectionsState } from "../../connections/types";

interface UseContactFormParams {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onSaved: () => void;
}

export function useContactForm(params: UseContactFormParams) {
  const { connectionsState, editingContact, onSaved } = params;
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = connectionsState;
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

    if (!user) {
      setError("Faça login para salvar um contato.");
      return;
    }

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
    clearFeedback,
    connections,
    connectionsError,
    control,
    error,
    errors,
    isLoadingConnections,
    isSubmitting,
    success,
    submitContact,
  };
}
