import type { User } from "firebase/auth";
import { createContext } from "react";

import type { LoginPayload, RegisterAccountPayload } from "../auth.service";

export interface AuthContextValue {
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  registerAccount: (payload: RegisterAccountPayload) => Promise<void>;
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
