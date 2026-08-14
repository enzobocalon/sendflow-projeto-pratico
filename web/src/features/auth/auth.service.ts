import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterAccountPayload extends LoginPayload {
  name?: string;
}

export function getAuthenticatedUser() {
  return auth.currentUser;
}

export function getAuthState(handleUserChanged: (user: User | null) => void) {
  return onIdTokenChanged(auth, handleUserChanged);
}

export function login(payload: LoginPayload) {
  const { email, password } = payload;

  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerAccount(payload: RegisterAccountPayload) {
  const { email, name, password } = payload;
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const displayName = name?.trim();

  if (displayName) {
    await updateProfile(credential.user, { displayName });
    await credential.user.reload();
    await credential.user.getIdToken(true);
  }

  return credential.user;
}

export function logout() {
  return signOut(auth);
}
