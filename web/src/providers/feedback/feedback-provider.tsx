import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { FeedbackSnackbar } from "@/components/feedback-snackbar";

import { FeedbackContext } from "./feedback-context";
import type { Feedback } from "./feedback-context";

interface FeedbackProviderProps {
  children: ReactNode;
}

interface DisplayedFeedback extends Feedback {
  id: number;
}

export function FeedbackProvider(props: FeedbackProviderProps) {
  const { children } = props;
  const feedbackId = useRef(0);
  const [feedback, setFeedback] = useState<DisplayedFeedback | null>(null);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const showError = useCallback((message: string) => {
    feedbackId.current += 1;
    setFeedback({ id: feedbackId.current, message, severity: "error" });
  }, []);

  const showSuccess = useCallback((message: string) => {
    feedbackId.current += 1;
    setFeedback({ id: feedbackId.current, message, severity: "success" });
  }, []);

  const contextValue = useMemo(
    () => ({ showError, showSuccess }),
    [showError, showSuccess],
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackSnackbar
        feedbackId={feedback?.id}
        message={feedback?.message}
        onClose={clearFeedback}
        severity={feedback?.severity ?? "success"}
      />
    </FeedbackContext.Provider>
  );
}
