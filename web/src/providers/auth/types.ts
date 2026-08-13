import type { User } from "firebase/auth";

export interface RegisterAccountPayload {
  email: string;
  name?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthContextValue {
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  registerAccount: (payload: RegisterAccountPayload) => Promise<void>;
  user: User | null;
}
