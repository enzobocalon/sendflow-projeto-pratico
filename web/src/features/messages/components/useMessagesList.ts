import { useMemo, useState } from "react";
import { useMessagesOptions } from "../../../hooks/useMessagesOptions";
import type { Message, MessageStatus } from "../types";
import { formatMessageDate } from "../../../utils/dates";

export function useMessagesList() {
  const { messages, error, isLoading } = useMessagesOptions();
  const [filter, setFilter] = useState<MessageStatus | 'all'>('all');

  const formattedMessages = useMemo(() => {
    if (!messages) return [];
    return messages.reduce((acc, message) => {
      if (filter === 'all' || message.status === filter) {
        const m = {
          ...message,
          date: formatMessageDate(message),
          recipients: message.contactIds.length,
        };
        acc.push(m);
      }
      return acc;
    }, [] as Message[]);
  }, [messages, filter]);

  const handleFilterChange = (status: MessageStatus | 'all') => {
    setFilter(status);
  };

  return {
    messages: formattedMessages,
    error,
    isLoading,
    handleFilterChange,
    filter,
  };
}
