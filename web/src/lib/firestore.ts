import { type DocumentData, type DocumentSnapshot } from "firebase/firestore";

import { getAuthenticatedUser } from "@/features/auth/auth.service";

export function snapDoc<T>(snapshot: DocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...(snapshot.data() as T),
  };
}

export function requireAuthenticatedUserId() {
  const userId = getAuthenticatedUser()?.uid;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return userId;
}
