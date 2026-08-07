import { useCallback, useMemo, useState } from "react";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { deleteContact } from "../../../services/contactService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const {
    contacts,
    error: contactsError,
    hasMore,
    isLoading: isLoadingContacts,
    isLoadingMore,
    loadMore,
  } = useContactsOptions({ searchTerm: debouncedSearchTerm });
  
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

  const requestDeleteContact = (contact: Contact) => {
    setError("");
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteDialogOpen(false);
  };

  const clearDeleteModal = () => {
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

      setIsDeleteDialogOpen(false);
    } catch (error) {
      setError(
        getFirebaseErrorMessage(error, "Não foi possível excluir o contato."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    closeDeleteModal,
    clearDeleteModal,
    confirmDeleteContact,
    contactToDelete,
    contacts,
    error: error || contactsError,
    getConnectionName,
    hasMore,
    isDeleteDialogOpen,
    isDeleting,
    isLoading: isLoadingContacts,
    isLoadingMore,
    loadMore,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts: contacts.length,
  };
};
