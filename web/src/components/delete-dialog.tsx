import { useId, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useDialog } from "@/providers/dialog/dialog-context";

export interface DeleteDialogProps {
  title: string;
  message: string;
  onConfirm: () => Promise<boolean>;
}

export function DeleteDialog(props: DeleteDialogProps) {
  const { title, message, onConfirm } = props;
  const { closeDialog } = useDialog();
  const [isLoading, setIsLoading] = useState(false);

  const titleId = useId();
  const descriptionId = useId();

  const handleClose = () => {
    if (!isLoading) closeDialog();
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      const didConfirm = await onConfirm();

      if (didConfirm) closeDialog();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress color="inherit" size={18} /> : null
          }
        >
          {isLoading ? "Excluindo..." : "Excluir"}
        </Button>
      </DialogActions>
    </>
  );
}
