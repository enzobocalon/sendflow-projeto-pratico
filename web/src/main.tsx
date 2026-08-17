import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/application.tsx";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { DialogProvider } from "@/providers/dialog/dialog-provider";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DialogProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </DialogProvider>
  </StrictMode>,
);
