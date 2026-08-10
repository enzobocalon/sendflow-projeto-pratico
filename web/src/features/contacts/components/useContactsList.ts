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
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const {
    contacts,
    currentPage,
    error: contactsError,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading: isLoadingContacts,
    isPageChanging,
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
    setDeleteError("");
    setDeleteSuccess("");
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

    setDeleteError("");
    setDeleteSuccess("");
    setIsDeleting(true);

    try {
      await deleteContact(contactToDelete.id);

      if (editingContact?.id === contactToDelete.id) {
        onDeletedEditingContact();
      }

      setDeleteSuccess("Contato excluído com sucesso.");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setDeleteError(
        getFirebaseErrorMessage(error, "Não foi possível excluir o contato."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const clearDeleteFeedback = () => {
    setDeleteError("");
    setDeleteSuccess("");
  };

  return {
    clearDeleteFeedback,
    closeDeleteModal,
    clearDeleteModal,
    confirmDeleteContact,
    contactToDelete,
    contacts,
    currentPage,
    deleteError,
    deleteSuccess,
    error: contactsError,
    getConnectionName,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isDeleteDialogOpen,
    isDeleting,
    isLoading: isLoadingContacts,
    isPageChanging,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts: contacts.length,
  };
};
