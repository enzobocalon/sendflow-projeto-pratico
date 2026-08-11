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
  "functions/failed-precondition":
    "A ação não pode ser concluída no estado atual.",
  "functions/invalid-argument":
    "Confira os dados informados e tente novamente.",
  "functions/permission-denied":
    "Você não tem permissão para realizar esta ação.",
  "functions/resource-exhausted": "O limite permitido foi atingido.",
  "functions/unauthenticated": "Faça login para continuar.",
};

export const getFirebaseErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  const errorCode = getFirebaseErrorCode(error);
  const knownMessage = errorCode ? fallbackByCode[errorCode] : undefined;

  if (knownMessage) return knownMessage;

  return getFirebaseErrorDetail(error) ?? fallbackMessage;
};
