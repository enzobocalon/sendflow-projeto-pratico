import { getAuthenticatedUser } from "@/features/auth/auth.service";

export function requireAuthenticatedUserId() {
  const userId = getAuthenticatedUser()?.uid;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return userId;
}
