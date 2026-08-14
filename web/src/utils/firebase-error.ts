type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const getFirebaseErrorCode = (error: unknown): string | null => {
  if (!isRecord(error) || typeof error.code !== "string") {
    return null;
  }

  return error.code;
};

export const getFirebaseErrorDetail = (error: unknown): string | null => {
  if (!(error instanceof Error) || !error.message) {
    return null;
  }

  return error.message.replace(/^FirebaseError:\s*/, "");
};

const fallbackByCode: Record<string, string> = {
  "firestore/failed-precondition":
    "A ação não pode ser concluída no estado atual.",
  "firestore/invalid-argument":
    "Confira os dados informados e tente novamente.",
  "firestore/permission-denied":
    "Você não tem permissão para realizar esta ação.",
  "firestore/resource-exhausted": "O limite permitido foi atingido.",
  "firestore/unauthenticated": "Faça login para continuar.",
};

export const getFirebaseErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  const errorCode = getFirebaseErrorCode(error);
  const errorDetail = getFirebaseErrorDetail(error);

  if (errorCode === "firestore/failed-precondition" && errorDetail) {
    return errorDetail;
  }

  const knownMessage = errorCode ? fallbackByCode[errorCode] : undefined;

  if (knownMessage) return knownMessage;

  return errorDetail ?? fallbackMessage;
};
