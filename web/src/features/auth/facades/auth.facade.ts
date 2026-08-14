import { FirebaseError } from "firebase/app";

import type {
  LoginPayload,
  RegisterAccountPayload,
} from "../services/auth.service";

interface HandleAuthenticationParams {
  isRegistering: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerAccount: (payload: RegisterAccountPayload) => Promise<void>;
  values: RegisterAccountPayload;
}

const authErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
};

export function handleAuthentication(params: HandleAuthenticationParams) {
  const { isRegistering, login, registerAccount, values } = params;

  if (isRegistering) {
    return registerAccount(values);
  }

  return login(values);
}

export function getAuthenticationErrorMessage(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : null;
  const knownMessage = code ? authErrorMessages[code] : undefined;

  return knownMessage ?? "Não foi possível concluir a autenticação.";
}
