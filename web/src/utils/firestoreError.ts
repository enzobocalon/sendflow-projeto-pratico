type FirestoreListResource = "conexões" | "contatos" | "mensagens";

type FirestoreError = {
  code?: string;
};

const firestoreErrorMessages: Record<
  string,
  (resource: FirestoreListResource) => string
> = {
  "failed-precondition": (resource) =>
    `Não foi possível carregar ${resource} porque um índice do Firestore ainda está sendo preparado`,
  "permission-denied": (resource) =>
    `Você não tem permissão para carregar ${resource}.`,
};

const buildDefaultErrorMessage = (
  resource: FirestoreListResource,
  code?: string,
): string =>
  code
    ? `Não foi possível carregar ${resource}. (${code})`
    : `Não foi possível carregar ${resource}.`;

export const getFirestoreErrorMessage = (
  error: FirestoreError,
  resource: FirestoreListResource,
): string => {
  const { code } = error;
  const knownMessage = code
    ? firestoreErrorMessages[code]?.(resource)
    : undefined;

  return knownMessage ?? buildDefaultErrorMessage(resource, code);
};
