import { createContext } from "react";

export type FeedbackSeverity = "error" | "success";

export interface Feedback {
  message: string;
  severity: FeedbackSeverity;
}

interface FeedbackContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);
