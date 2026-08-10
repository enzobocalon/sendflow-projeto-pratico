import { useState } from "react";
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
