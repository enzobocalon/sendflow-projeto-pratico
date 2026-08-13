import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/application.tsx";
import { AuthProvider } from "@/providers/auth";
import { DialogProvider } from "@/providers/dialog";

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
