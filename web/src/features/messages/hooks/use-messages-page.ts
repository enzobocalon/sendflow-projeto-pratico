import { useState } from "react";

import type { Message } from "../messages.model";

export function useMessagesPage() {
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const editMessage = (message: Message) => {
    setEditingMessage(message);
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
  };

  return {
    cancelEditMessage,
    editMessage,
    editingMessage,
  };
}
