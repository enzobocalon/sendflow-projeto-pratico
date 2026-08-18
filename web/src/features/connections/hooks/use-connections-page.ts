import { useEditableItem } from "@/hooks/use-editable-item";

import type { Connection } from "../connections.model";

export function useConnectionsPage() {
  const {
    cancelEdit,
    editItem: editConnection,
    editingItem: editingConnection,
  } = useEditableItem<Connection>();

  return {
    cancelEdit,
    editConnection,
    editingConnection,
  };
}
