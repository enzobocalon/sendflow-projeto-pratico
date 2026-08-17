import { useMemo, useState } from "react";

import type { ConnectionsState } from "@/features/connections/hooks/use-connections";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDelete } from "@/hooks/use-delete";

import { deleteContact, type Contact } from "../contact.model";
import { useContacts } from "./use-contacts";

interface UseContactsListParams {
  connectionsState: ConnectionsState;
  editingContact: Contact | null;
  onDeletedEditingContact: () => void;
}

export function useContactsList(params: UseContactsListParams) {
  const { connectionsState, editingContact, onDeletedEditingContact } = params;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const handleDeletedContact = (contact: Contact) => {
    if (editingContact?.id === contact.id) {
      onDeletedEditingContact();
    }
  };

  const {
    state: { isDeleting },
    actions: { requestDelete: requestDeleteContact },
  } = useDelete<Contact>({
    confirmationMessage: (contact) =>
      `Tem certeza que deseja excluir o contato "${contact.name}"? Esta ação não pode ser desfeita.`,
    handleDelete: deleteContact,
    onDeleted: handleDeletedContact,
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
      hasNextPage,
      hasPreviousPage,
      isDeleting,
      isLoading: isLoadingContacts || isLoadingConnections,
      isPageChanging,
      searchTerm,
      totalContacts: contacts.length,
    },
    actions: {
      goToNextPage,
      goToPreviousPage,
      requestDeleteContact,
      setSearchTerm,
    },
  };
}
