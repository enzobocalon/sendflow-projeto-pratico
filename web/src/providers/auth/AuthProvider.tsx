import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { AuthContext } from "./AuthContext";
import { auth } from "../../lib/firebase";
import type { LoginPayload, RegisterAccountPayload } from "./types";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async ({ email, password }: LoginPayload) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerAccount = async ({
    email,
    name,
    password,
  }: RegisterAccountPayload) => {
    setProfileLoading(true);

    try {
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

      setUser(auth.currentUser);
    } finally {
      setProfileLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      loading: authLoading || profileLoading,
      login,
      logout,
      registerAccount,
      user,
    }),
    [authLoading, profileLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
