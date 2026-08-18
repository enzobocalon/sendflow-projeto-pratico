import { useEditableItem } from "@/hooks/use-editable-item";

import type { Message } from "../messages.model";

export function useMessagesPage() {
  const {
    cancelEdit: cancelEditMessage,
    editItem: editMessage,
    editingItem: editingMessage,
  } = useEditableItem<Message>();

  return {
    cancelEditMessage,
    editMessage,
    editingMessage,
  };
}
