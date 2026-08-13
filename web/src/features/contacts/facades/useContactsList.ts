import { useMemo, useState } from "react";
import { useContacts } from "../models/useContacts";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useDelete } from "../../../facades/useDelete";
import { deleteContact } from "../models/contactModel";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";
import type { Contact } from "../types";
import type { ConnectionsState } from "../../connections/types";

interface UseContactsListParams {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
}

export function useContactsList(params: UseContactsListParams) {
  const { connectionsState, editingContact, onDeletedEditingContact } = params;
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
  } = useContacts({ searchTerm: debouncedSearchTerm });
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
}
