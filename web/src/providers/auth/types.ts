import type { User } from "firebase/auth";

export type RegisterAccountPayload = {
  email: string;
  name?: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  registerAccount: (payload: RegisterAccountPayload) => Promise<void>;
  user: User | null;
};
