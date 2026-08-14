import type { User } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getAuthenticatedUser,
  getAuthState,
  login as loginWithService,
  logout as logoutWithService,
  registerAccount as registerAccountWithService,
  type LoginPayload,
  type RegisterAccountPayload,
} from "../services/auth.service";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider(props: AuthProviderProps) {
  const { children } = props;
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = getAuthState((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (payload: LoginPayload) => {
    await loginWithService(payload);
  };

  const registerAccount = async (payload: RegisterAccountPayload) => {
    setProfileLoading(true);

    try {
      await registerAccountWithService(payload);
      setUser(getAuthenticatedUser());
    } finally {
      setProfileLoading(false);
    }
  };

  const logout = async () => {
    await logoutWithService();
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
}
