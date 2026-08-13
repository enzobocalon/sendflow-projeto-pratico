import { useMemo, useState } from "react";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useDelete } from "../../../hooks/useDelete";
import { deleteContact } from "../services/contactService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";
import type { Contact } from "../types";
import type { ConnectionsState } from "../../connections/types";

type UseContactsListParams = {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
};

export const useContactsList = ({
  connectionsState,
  editingContact,
  onDeletedEditingContact,
}: UseContactsListParams) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const {
    clearDeleteFeedback,
    deleteError,
    deleteSuccess,
    isDeleting,
    requestDelete: requestDeleteContact,
  } = useDelete<Contact>({
    deleteItem: (contact) => deleteContact(contact.id),
    dialogTitle: "Excluir contato?",
    getDialogMessage: (contact) =>
      `Tem certeza que deseja excluir o contato ${contact.name}? Esta ação não pode ser desfeita.`,
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
  const {
    connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
  } = connectionsState;
  const contactsWithConnectionNames = useMemo(() => {
    const connectionNames = new Map(
      connections.map((connection) => [connection.id, connection.name]),
    );

    return contacts.map((contact) => ({
      ...contact,
      connectionName:
        connectionNames.get(contact.connectionId) ?? "Conexão não encontrada",
    }));
  }, [connections, contacts]);

  return {
    clearDeleteFeedback,
    contacts: contactsWithConnectionNames,
    currentPage,
    deleteError,
    deleteSuccess,
    error: contactsError || connectionsError,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isDeleting,
    isLoading: isLoadingContacts || isLoadingConnections,
    isPageChanging,
    requestDeleteContact,
    searchTerm,
    setSearchTerm,
    totalContacts: contacts.length,
  };
};
