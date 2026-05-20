import { useMemo, useState, type MouseEvent } from "react";
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
  const { messages, error, hasMore, isLoading, isLoadingMore, loadMore } =
    useMessagesOptions({
      status: filter,
    });
  const [isDeleting, setIsDeleting] = useState(false);
  const [listError, setListError] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
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

  const requestDeleteMessage = (message: Message) => {
    setListError("");
    setMessageToDelete(message);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setMessageToDelete(null);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) {
      return;
    }

    setListError("");
    setIsDeleting(true);

    try {
      await deleteMessage(messageToDelete.id);

      if (editingMessage?.id === messageToDelete.id) {
        onDeletedEditingMessage();
      }

      closeDeleteModal();
    } catch (error) {
      setListError(
        getFirebaseErrorMessage(error, "Não foi possível excluir a mensagem."),
      );
    } finally {
      setIsDeleting(false);
    }
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
    messages: formattedMessages,
    error: listError || error,
    isLoading,
    handleFilterChange,
    filter,
    hasMore,
    isLoadingMore,
    loadMore,
    closeDeleteModal,
    confirmDeleteMessage,
    isDeleting,
    messageToDelete,
    requestDeleteMessage,
    handleEdit,
    handleDelete,
    openMenu,
    menuAnchor,
    closeMenu,
    selectedMessage,
  };
}
