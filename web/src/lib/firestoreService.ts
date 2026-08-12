import { FirebaseError } from "firebase/app";
import { auth } from "./firebase";

type FirestoreServiceErrorCode =
  | "failed-precondition"
  | "invalid-argument"
  | "permission-denied"
  | "resource-exhausted"
  | "unauthenticated";

export const createFirestoreServiceError = (
  code: FirestoreServiceErrorCode,
  message: string,
) => new FirebaseError(`firestore/${code}`, message);

export const requireAuthenticatedUserId = (message: string) => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw createFirestoreServiceError("unauthenticated", message);
  }

  return userId;
};
