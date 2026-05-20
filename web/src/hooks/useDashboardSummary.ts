import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const emptySummary = {
  connections: 0,
  contacts: 0,
  messages: 0,
  scheduledMessages: 0,
};

type UsageDocument = Partial<{
  connectionsCount: number;
  contactsCount: number;
  messagesCount: number;
  scheduledMessagesCount: number;
}>;

export const useDashboardSummary = () => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    if (!user) return;

    let isActive = true;
    const handleError = () => {
      if (!isActive) return;

      setError("Não foi possível carregar os dados totais do dashboard.");
      setIsLoading(false);
    };

    const unsubscribe = onSnapshot(
      doc(db, "usage", user.uid),
      (snapshot) => {
        if (!isActive) return;

        const usage = (snapshot.data() ?? {}) as UsageDocument;

        setSummary({
          connections: usage.connectionsCount ?? 0,
          contacts: usage.contactsCount ?? 0,
          messages: usage.messagesCount ?? 0,
          scheduledMessages: usage.scheduledMessagesCount ?? 0,
        });
        setError("");
        setIsLoading(false);
      },
      handleError,
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user]);

  if (!user) {
    return { error: "", isLoading: false, summary: emptySummary };
  }

  return { error, isLoading, summary };
};
