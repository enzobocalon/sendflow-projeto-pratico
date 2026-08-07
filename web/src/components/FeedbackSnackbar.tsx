import { Alert, Snackbar } from "@mui/material";
import { useState } from "react";

type FeedbackSnackbarProps = {
  message?: string;
  onClose: () => void;
  severity: "error" | "success";
};

export const FeedbackSnackbar = ({
  message,
  onClose,
  severity,
}: FeedbackSnackbarProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = (_event?: unknown, reason?: string) => {
    if (reason === "clickaway") return;

    setIsClosing(true);
  };

  const handleExited = () => {
    setIsClosing(false);
    onClose();
  };

  return (
    <Snackbar
      open={Boolean(message) && !isClosing}
      autoHideDuration={4000}
      onClose={handleClose}
      slotProps={{
        transition: {
          onExited: handleExited,
        },
      }}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
