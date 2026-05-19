import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Message } from "../features/messages/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const getMessageDateMillis = (message: Message) => {
  const date = message.scheduledAt ?? message.sentAt ?? message.createdAt;

  return date?.toMillis() ?? 0;
};

export function useMessagesOptions() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map(
            (document) =>
              ({
                id: document.id,
                ...document.data(),
              }) as Message,
          )
          .sort(
            (current, next) =>
              getMessageDateMillis(next) - getMessageDateMillis(current),
          );

        setMessages(nextMessages);
        setIsLoading(false);
        setError("");
      },
      () => {
        setError("Não foi possível carregar as mensagens.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  return {
    error,
    isLoading,
    messages,
  };
}
