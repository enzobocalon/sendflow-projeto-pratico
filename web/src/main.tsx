import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/application.tsx";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { DialogProvider } from "@/providers/dialog/dialog-provider";
import { FeedbackProvider } from "@/providers/feedback/feedback-provider";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FeedbackProvider>
      <DialogProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DialogProvider>
    </FeedbackProvider>
  </StrictMode>,
);
