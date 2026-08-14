import type { MessageStatus } from "@sendflow/shared";
import { useMemo, useState, type MouseEvent } from "react";

import { useDelete } from "@/hooks/use-delete";
import { formatMessageDate } from "@/utils/dates";

import { deleteMessage, type Message } from "../models/message.model";
import { useMessages } from "./use-messages";

export interface MessageListItem extends Message {
  date: string;
  recipients: number;
}

interface UseMessagesListParams {
  editingMessage: Message | null;
  onDeletedEditingMessage: () => void;
  onEdit: (message: Message) => void;
}

export function useMessagesList(params: UseMessagesListParams) {
  const { editingMessage, onDeletedEditingMessage, onEdit } = params;
  const [filter, setFilter] = useState<MessageStatus | "all">("all");
  const {
    currentPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPageChanging,
    messages,
  } = useMessages({ status: filter });

  const handleDeletedMessage = (message: Message) => {
    if (editingMessage?.id === message.id) {
      onDeletedEditingMessage();
    }
  };

  const {
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete: requestDeleteMessage },
  } = useDelete<Message>({
    confirmationMessage:
      "Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.",
    handleDelete: deleteMessage,
    onDeleted: handleDeletedMessage,
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
    state: {
      currentPage,
      feedback,
      filter,
      hasNextPage,
      hasPreviousPage,
      isDeleting,
      isLoading,
      isPageChanging,
      menuAnchor,
      messages: formattedMessages,
      selectedMessage,
    },
    actions: {
      clearFeedback,
      closeMenu,
      goToNextPage,
      goToPreviousPage,
      handleDelete,
      handleEdit,
      handleFilterChange,
      openMenu,
    },
  };
}
