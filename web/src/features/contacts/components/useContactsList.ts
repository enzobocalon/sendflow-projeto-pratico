import { useCallback, useMemo, useState } from "react";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useDelete } from "../../../hooks/useDelete";
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
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const {
    clearDeleteDialog: clearDeleteModal,
    clearDeleteFeedback,
    closeDeleteDialog: closeDeleteModal,
    confirmDelete: confirmDeleteContact,
    deleteError,
    deleteSuccess,
    isDeleteDialogOpen,
    isDeleting,
    itemToDelete: contactToDelete,
    requestDelete: requestDeleteContact,
  } = useDelete<Contact>({
    deleteItem: (contact) => deleteContact(contact.id),
    getErrorMessage: (error) =>
      getFirebaseErrorMessage(error, "Não foi possível excluir o contato."),
    onDeleted: (contact) => {
      if (editingContact?.id === contact.id) {
        onDeletedEditingContact();
      }
    },
    successMessage: "Contato excluído com sucesso.",
  });

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
