import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { contactSchema } from "./schemas/contactSchema";
import { useConnectionOptions } from "../../hooks/useConnectionsOptions";
import { useAuth } from "../../hooks/useAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useContactsOptions } from "../../hooks/useContactsOptions";
import type { Contact, ContactFormValues } from "./types";

export function useContacts() {
  const { user } = useAuth();
  const { contacts, error: contactsError, isLoading: isLoadingContacts } = useContactsOptions();
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = useConnectionOptions();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

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

  const onSubmit = handleSubmit(async ({ name, connectionId, phone }) => {
    if (!user) {
      setFormError("Faça login para salvar um contato.");
      return;
    }

    setFormError("");

    try {
      if (editingContact) {
        await updateDoc(doc(db, "contacts", editingContact.id), {
          name: name.trim(),
          phone: phone.trim(),
          connectionId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "contacts"), {
          createdAt: serverTimestamp(),
          name: name.trim(),
          phone: phone.trim(),
          connectionId,
          updatedAt: serverTimestamp(),
          userId: user.uid,
        });
      }

      setEditingContact(null);
      reset();
    } catch {
      setFormError("Não foi possível salvar o contato.");
    }
  });

  const editContact = (contact: Contact) => {
    setFormError("");
    setEditingContact(contact);
  };

  const cancelEditContact = () => {
    setFormError("");
    setEditingContact(null);
  };

  const requestDeleteContact = (contact: Contact) => {
    setListError("");
    setContactToDelete(contact);
  };

  const closeDeleteModal = () => {
    if (isDeletingContact) {
      return;
    }

    setContactToDelete(null);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) {
      return;
    }

    setListError("");
    setIsDeletingContact(true);

    try {
      await deleteDoc(doc(db, "contacts", contactToDelete.id));

      if (editingContact?.id === contactToDelete.id) {
        cancelEditContact();
      }

      closeDeleteModal();
    } catch {
      setListError("Não foi possível excluir o contato.");
    } finally {
      setIsDeletingContact(false);
    }
  };

  useEffect(() => {
      reset({
        name: editingContact?.name ?? "",
        phone: editingContact?.phone ?? "",
        connectionId: editingContact?.connectionId ?? "",
      });
    }, [editingContact, reset]);

  const connectionNameById = useMemo(
    () =>
      new Map(
        connections.map((connection) => [connection.id, connection.name]),
      ),
    [connections],
  );

  const getConnectionName = useCallback(
    (connectionId: string) =>
      connectionNameById.get(connectionId) ?? "Conexão não encontrada",
    [connectionNameById],
  );

  const filteredContacts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const connectionName = getConnectionName(contact.connectionId);

      return [contact.name, contact.phone, connectionName].some((value) =>
        value.toLowerCase().includes(normalizedSearchTerm),
      );
    });
  }, [contacts, getConnectionName, searchTerm]);

  return {
    control,
    errors,
    onSubmit,
    connections,
    connectionsError,
    isLoadingConnections,
    isSubmitting,
    formError,
    listError: listError || contactsError,
    contacts: filteredContacts,
    isLoadingContacts,
    editingContact,
    editContact,
    cancelEditContact,
    contactToDelete,
    requestDeleteContact,
    closeDeleteModal,
    confirmDeleteContact,
    isDeletingContact,
    getConnectionName,
    searchTerm,
    setSearchTerm,
    totalContacts: contacts.length,
  };
}
