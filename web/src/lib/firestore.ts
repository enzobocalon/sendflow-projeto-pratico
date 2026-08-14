import { FirebaseError } from "firebase/app";

import { getAuthenticatedUser } from "@/features/auth/services/auth.service";

type FirestoreErrorCode =
  | "failed-precondition"
  | "invalid-argument"
  | "permission-denied"
  | "resource-exhausted"
  | "unauthenticated";

export function createFirestoreError(
  code: FirestoreErrorCode,
  message: string,
) {
  return new FirebaseError(`firestore/${code}`, message);
}

export function requireAuthenticatedUserId(message: string) {
  const userId = getAuthenticatedUser()?.uid;

  if (!userId) {
    throw createFirestoreError("unauthenticated", message);
  }

  return userId;
}
