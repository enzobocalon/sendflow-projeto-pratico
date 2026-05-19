import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const emptySummary = {
  connections: 0,
  contacts: 0,
  messages: 0,
  scheduledMessages: 0,
};

export const useDashboardSummary = () => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    if (!user) return;

    const userFilter = where("userId", "==", user.uid);
    const handleError = () => {
      setError("Não foi possível carregar os dados totais do dashboard.");
      setIsLoading(false);
    };

    const unsubscribeConnections = onSnapshot(
      query(collection(db, "connections"), userFilter),
      (snapshot) => {
        setSummary((currentSummary) => ({
          ...currentSummary,
          connections: snapshot.size,
        }));
        setError("");
        setIsLoading(false);
      },
      handleError,
    );

    const unsubscribeContacts = onSnapshot(
      query(collection(db, "contacts"), userFilter),
      (snapshot) => {
        setSummary((currentSummary) => ({
          ...currentSummary,
          contacts: snapshot.size,
        }));
        setError("");
        setIsLoading(false);
      },
      handleError,
    );

    const unsubscribeMessages = onSnapshot(
      query(collection(db, "messages"), userFilter),
      (snapshot) => {
        setSummary((currentSummary) => ({
          ...currentSummary,
          messages: snapshot.size,
        }));
        setError("");
        setIsLoading(false);
      },
      handleError,
    );

    const unsubscribeScheduledMessages = onSnapshot(
      query(
        collection(db, "messages"),
        userFilter,
        where("status", "==", "scheduled"),
      ),
      (snapshot) => {
        setSummary((currentSummary) => ({
          ...currentSummary,
          scheduledMessages: snapshot.size,
        }));
        setError("");
        setIsLoading(false);
      },
      handleError,
    );

    return () => {
      unsubscribeConnections();
      unsubscribeContacts();
      unsubscribeMessages();
      unsubscribeScheduledMessages();
    };
  }, [user]);

  if (!user) {
    return { error: "", isLoading: false, summary: emptySummary };
  }

  return { error, isLoading, summary };
};
