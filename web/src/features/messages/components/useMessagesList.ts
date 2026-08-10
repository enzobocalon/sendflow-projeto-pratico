import { useMemo, useState, type MouseEvent } from "react";
import { useDelete } from "../../../hooks/useDelete";
import { useMessagesOptions } from "../../../hooks/useMessagesOptions";
import type { Message, MessageStatus } from "../types";
import { formatMessageDate } from "../../../utils/dates";
import { deleteMessage } from "../../../services/messageService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";

export type MessageListItem = Message & {
  date: string;
  recipients: number;
};

type UseMessagesListParams = {
  editingMessage: Message | null;
  onDeletedEditingMessage: () => void;
  onEdit: (message: Message) => void;
};

export function useMessagesList({
  editingMessage,
  onDeletedEditingMessage,
  onEdit,
}: UseMessagesListParams) {
  const [filter, setFilter] = useState<MessageStatus | "all">("all");
  const {
    currentPage,
    error,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
    messages,
  } = useMessagesOptions({
    status: filter,
  });
  const {
    clearDeleteDialog: clearDeleteModal,
    clearDeleteFeedback,
    closeDeleteDialog: closeDeleteModal,
    confirmDelete: confirmDeleteMessage,
    deleteError,
    deleteSuccess,
    isDeleteDialogOpen,
    isDeleting,
    requestDelete: requestDeleteMessage,
  } = useDelete<Message>({
    deleteItem: (message) => deleteMessage(message.id),
    getErrorMessage: (error) =>
      getFirebaseErrorMessage(error, "Não foi possível excluir a mensagem."),
    onDeleted: (message) => {
      if (editingMessage?.id === message.id) {
        onDeletedEditingMessage();
      }
    },
    successMessage: "Mensagem excluída com sucesso.",
  });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedMessage, setSelectedMessage] =
    useState<MessageListItem | null>(null);

  const formattedMessages = useMemo(() => {
    return messages.map((message) => ({
      ...message,
      date: formatMessageDate(message),
      recipients: message.recipientsCount ?? message.contactIds.length,
    }));
  }, [messages]);

  const handleFilterChange = (status: MessageStatus | "all") => {
    setFilter(status);
  };

  const openMenu = (
    event: MouseEvent<HTMLButtonElement>,
    message: MessageListItem,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setSelectedMessage(null);
  };

  const handleEdit = () => {
    if (!selectedMessage) {
      return;
    }

    onEdit(selectedMessage);
    closeMenu();
  };

  const handleDelete = () => {
    if (!selectedMessage) {
      return;
    }

    requestDeleteMessage(selectedMessage);
    closeMenu();
  };

  return {
    clearDeleteModal,
    clearDeleteFeedback,
    currentPage,
    messages: formattedMessages,
    deleteError,
    deleteSuccess,
    error,
    isLoading,
    isPageChanging,
    handleFilterChange,
    filter,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    closeDeleteModal,
    confirmDeleteMessage,
    isDeleting,
    isDeleteDialogOpen,
    requestDeleteMessage,
    handleEdit,
    handleDelete,
    openMenu,
    menuAnchor,
    closeMenu,
    selectedMessage,
  };
}
