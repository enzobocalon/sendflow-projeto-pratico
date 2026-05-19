import { useEffect, useState } from "react";
import type { Connection } from "../features/connections/types";
import { useAuth } from "./useAuth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useConnectionOptions() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(() => Boolean(user));
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (!user) {
      return;
    }

    const connectionsQuery = query(
      collection(db, "connections"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      connectionsQuery,
      (snapshot) => {
        const nextConnections = snapshot.docs
          .map(
            (document) =>
              ({
                id: document.id,
                ...document.data(),
              }) as Connection,
          )
          .sort((current, next) => current.name.localeCompare(next.name));

        setConnections(nextConnections);
        setIsLoading(false);
        setError("");
      },
      () => {
        setError("Não foi possível carregar as conexões.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  return {
    connections,
    isLoading,
    error
  };
}
