import { MessageComposer } from "./components/MessageComposer";
import { MessagesList } from "./components/MessagesList";
import { useMessagesPage } from "./facades/useMessagesPage";

export function MessagesPage() {
  const { cancelEditMessage, editMessage, editingMessage } = useMessagesPage();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <MessageComposer
        editingMessage={editingMessage}
        onCancel={cancelEditMessage}
        onSaved={cancelEditMessage}
      />
      <MessagesList
        editingMessage={editingMessage}
        onDeletedEditingMessage={cancelEditMessage}
        onEdit={editMessage}
      />
    </div>
  );
}
