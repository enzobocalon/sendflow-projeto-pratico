import { useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import type { FeedbackSeverity } from "@/providers/feedback/feedback-context";

interface FeedbackSnackbarProps {
  feedbackId?: number;
  message?: string;
  severity: FeedbackSeverity;
  onClose: () => void;
}

interface DisplayedFeedback {
  id: number;
  message: string;
  severity: FeedbackSeverity;
}

export function FeedbackSnackbar(props: FeedbackSnackbarProps) {
  const { feedbackId, message, severity, onClose } = props;
  const [feedback, setFeedback] = useState<DisplayedFeedback | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [previousFeedbackId, setPreviousFeedbackId] = useState(feedbackId);

  if (feedbackId !== previousFeedbackId) {
    setPreviousFeedbackId(feedbackId);

    if (feedbackId && message) {
      setFeedback({ id: feedbackId, message, severity });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }

  const handleClose = (_event?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setIsOpen(false);
  };

  const handleExited = () => {
    if (isOpen) return;
    setFeedback(null);
    onClose();
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={4000}
      onClose={handleClose}
      slotProps={{ transition: { onExited: handleExited } }}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        key={feedback?.id}
        onClose={handleClose}
        severity={feedback?.severity ?? "success"}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {feedback?.message}
      </Alert>
    </Snackbar>
  );
}
