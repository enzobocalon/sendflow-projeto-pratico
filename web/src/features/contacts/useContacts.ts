import { useState } from "react";
import type { Contact } from "./types";

export function useContacts() {
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const editContact = (contact: Contact) => {
    setEditingContact(contact);
  };

  const cancelEditContact = () => {
    setEditingContact(null);
  };

  return {
    cancelEditContact,
    editContact,
    editingContact,
  };
}
