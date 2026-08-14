import { useMemo, useState } from "react";

import { useDelete } from "@/facades/use-delete";
import type { ConnectionsState } from "@/features/connections/models/use-connections";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getFirebaseErrorMessage } from "@/utils/firebase-error";

import { deleteContact, type Contact } from "../models/contact.model";
import { useContacts } from "../models/use-contacts";

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
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete: requestDeleteContact },
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
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading: isLoadingContacts,
    isPageChanging,
  } = useContacts({ searchTerm: debouncedSearchTerm });
  const { connections, isLoading: isLoadingConnections } = connectionsState;
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
    state: {
      contacts: contactsWithConnectionNames,
      currentPage,
      feedback,
      hasNextPage,
      hasPreviousPage,
      isDeleting,
      isLoading: isLoadingContacts || isLoadingConnections,
      isPageChanging,
      searchTerm,
      totalContacts: contacts.length,
    },
    actions: {
      clearFeedback,
      goToNextPage,
      goToPreviousPage,
      requestDeleteContact,
      setSearchTerm,
    },
  };
}
