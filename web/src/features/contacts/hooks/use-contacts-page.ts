import { useConnections } from "@/features/connections/hooks/use-connections";
import { useEditableItem } from "@/hooks/use-editable-item";

import type { Contact } from "../contacts.model";

export function useContactsPage() {
  const {
    cancelEdit: cancelEditContact,
    editItem: editContact,
    editingItem: editingContact,
  } = useEditableItem<Contact>();
  const connectionsState = useConnections();

  return {
    cancelEditContact,
    connectionsState,
    editContact,
    editingContact,
  };
}
