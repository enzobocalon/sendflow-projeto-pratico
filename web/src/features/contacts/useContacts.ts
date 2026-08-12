import { useState } from "react";
import { useConnectionsOptions } from "../../hooks/useConnectionsOptions";
import type { Contact } from "./types";

export function useContacts() {
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const connectionsState = useConnectionsOptions();

  const editContact = (contact: Contact) => {
    setEditingContact(contact);
  };

  const cancelEditContact = () => {
    setEditingContact(null);
  };

  return {
    cancelEditContact,
    connectionsState,
    editContact,
    editingContact,
  };
}
