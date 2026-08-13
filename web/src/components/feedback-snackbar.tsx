import { useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface FeedbackSnackbarProps {
  message?: string;
  severity: "error" | "success";
  onClose: () => void;
}

interface Feedback {
  id: number;
  message: string;
  severity: "error" | "success";
}

export function FeedbackSnackbar(props: FeedbackSnackbarProps) {
  const { message, severity, onClose } = props;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [prevMessage, setPrevMessage] = useState(message);
  const [prevSeverity, setPrevSeverity] = useState(severity);

  if (message !== prevMessage || severity !== prevSeverity) {
    setPrevMessage(message);
    setPrevSeverity(severity);

    if (message) {
      setFeedback((prev) => ({ id: (prev?.id ?? 0) + 1, message, severity }));
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
