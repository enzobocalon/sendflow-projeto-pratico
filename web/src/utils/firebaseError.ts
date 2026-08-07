type FirebaseLikeError = { code: string; message?: string };

const isFirebaseLikeError = (error: unknown): error is FirebaseLikeError =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as Record<string, unknown>).code === "string";

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
  if (isFirebaseLikeError(error) && error.code in fallbackByCode) {
    return fallbackByCode[error.code];
  }

  if (error instanceof Error && error.message) {
    return error.message.replace(/^FirebaseError:\s*/, "");
  }

  return fallbackMessage;
};
