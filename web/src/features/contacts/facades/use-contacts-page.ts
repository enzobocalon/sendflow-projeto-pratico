import { useState } from "react";
import { useConnections } from "../../connections/models/use-connections";
import type { Contact } from "../types";

export function useContactsPage() {
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const connectionsState = useConnections();

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
