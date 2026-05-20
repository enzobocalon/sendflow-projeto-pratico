const fallbackByCode: Record<string, string> = {
  "functions/failed-precondition": "A ação não pode ser concluída no estado atual.",
  "functions/invalid-argument": "Confira os dados informados e tente novamente.",
  "functions/permission-denied": "Você não tem permissão para realizar esta ação.",
  "functions/resource-exhausted": "O limite permitido foi atingido.",
  "functions/unauthenticated": "Faça login para continuar.",
};

export const getFirebaseErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof Error && error.message) {
    return error.message.replace(/^FirebaseError:\s*/, "");
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return fallbackByCode[error.code] ?? fallbackMessage;
  }

  return fallbackMessage;
};
