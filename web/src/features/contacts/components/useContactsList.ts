import { useCallback, useMemo, useState } from "react";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { deleteContact } from "../../../services/contactService";
import type { Contact } from "../types";

type UseContactsListParams = {
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
};

export const useContactsList = ({
  editingContact,
  onDeletedEditingContact,
}: UseContactsListParams) => {
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    contacts,
    error: contactsError,
    isLoading: isLoadingContacts,
  } = useContactsOptions();
  const { connections } = useConnectionsOptions();

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

  const requestDeleteContact = (contact: Contact) => {
    setError("");
    setContactToDelete(contact);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setContactToDelete(null);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteContact(contactToDelete.id);

      if (editingContact?.id === contactToDelete.id) {
        onDeletedEditingContact();
      }

      closeDeleteModal();
    } catch {
      setError("Não foi possível excluir o contato.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    closeDeleteModal,
    confirmDeleteContact,
    contactToDelete,
    contacts: filteredContacts,
    error: error || contactsError,
    getConnectionName,
    isDeleting,
    isLoading: isLoadingContacts,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts: contacts.length,
  };
};
