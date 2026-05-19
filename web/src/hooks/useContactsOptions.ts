import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Contact } from "../features/contacts/types";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

export function useContactsOptions() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(user));

  useEffect(() => {
    if (!user) {
      return;
    }

    const contactsQuery = query(
      collection(db, "contacts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        const contactsData: Contact[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contact[];

        setContacts(contactsData);
        setIsLoading(false);
      },
      () => {
        setError("Não foi possível carregar os contatos.");
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  return {
    contacts,
    error,
    isLoading,
  };
}
