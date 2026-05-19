import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

export type DeleteDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const DeleteDialog = ({ title, open, onCancel, onClose, onConfirm, isLoading, message }: DeleteDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-contact-title"
      aria-describedby="delete-contact-description"
    >
      <DialogTitle id="delete-contact-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-contact-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress color="inherit" size={18} /> : null
          }
        >
          {isLoading ? "Excluindo..." : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
