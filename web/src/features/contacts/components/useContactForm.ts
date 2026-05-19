import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/useAuth";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { createContact, updateContact } from "../../../services/contactService";
import { contactSchema } from "../schemas/contactSchema";
import type { Contact, ContactFormValues } from "../types";

type UseContactFormParams = {
  editingContact: Contact | null;
  onSaved: () => void;
};

export const useContactForm = ({
  editingContact,
  onSaved,
}: UseContactFormParams) => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = useConnectionsOptions();
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
    if (!user) {
      setError("Faça login para salvar um contato.");
      return;
    }

    setError("");

    try {
      if (editingContact) {
        await updateContact({
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
          userId: user.uid,
        });
      }

      reset();
      onSaved();
    } catch {
      setError("Não foi possível salvar o contato.");
    }
  });

  return {
    connections,
    connectionsError,
    control,
    error,
    errors,
    isLoadingConnections,
    isSubmitting,
    submitContact,
  };
};
