import { useState } from "react";
import { DeleteDialog } from "../components/DeleteDialog";
import { useDialog } from "../providers/dialog";

interface UseDeleteParams<Item> {
  deleteItem: (item: Item) => Promise<unknown>;
  dialogTitle: string;
  getDialogMessage: (item: Item) => string;
  getErrorMessage: (error: unknown) => string;
  onDeleted?: (item: Item) => void;
  successMessage: string;
}

export function useDelete<Item>(params: UseDeleteParams<Item>) {
  const {
    deleteItem,
    dialogTitle,
    getDialogMessage,
    getErrorMessage,
    onDeleted,
    successMessage,
  } = params;
  const { openDialog } = useDialog();
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (item: Item) => {
    setDeleteError("");
    setDeleteSuccess("");
    setIsDeleting(true);

    try {
      await deleteItem(item);
      onDeleted?.(item);
      setDeleteSuccess(successMessage);
      return true;
    } catch (error) {
      setDeleteError(getErrorMessage(error));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = (item: Item) => {
    setDeleteError("");
    setDeleteSuccess("");

    openDialog({
      fullWidth: true,
      maxWidth: "xs",
      children: (
        <DeleteDialog
          title={dialogTitle}
          message={getDialogMessage(item)}
          onConfirm={() => confirmDelete(item)}
        />
      ),
    });
  };

  const clearDeleteFeedback = () => {
    setDeleteError("");
    setDeleteSuccess("");
  };

  return {
    clearDeleteFeedback,
    deleteError,
    deleteSuccess,
    isDeleting,
    requestDelete,
  };
}
