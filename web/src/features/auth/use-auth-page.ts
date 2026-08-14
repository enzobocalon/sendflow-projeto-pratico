import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  getAuthenticationErrorMessage,
  handleAuthentication,
} from "./auth.facade";
import {
  loginSchema,
  registerSchema,
  type AuthFormValues,
} from "./auth.schema";
import { useAuth } from "./use-auth";

type AuthMode = "login" | "register";

export function useAuthPage() {
  const { login, registerAccount } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const isRegistering = mode === "register";
  const schema = useMemo(
    () => (isRegistering ? registerSchema : loginSchema),
    [isRegistering],
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(schema),
  });

  const submitAuth = handleSubmit(async (values) => {
    setError("");

    try {
      await handleAuthentication({
        isRegistering,
        login,
        registerAccount,
        values,
      });
    } catch (authError) {
      setError(getAuthenticationErrorMessage(authError));
    }
  });

  const switchMode = () => {
    setMode(isRegistering ? "login" : "register");
    setError("");
    reset({ email: "", name: "", password: "" });
  };

  return {
    state: { error, isRegistering, isSubmitting },
    form: { errors, register },
    actions: { submitAuth, switchMode },
  };
}
