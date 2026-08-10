import { useState } from "react";

type UseDeleteParams<Item> = {
  deleteItem: (item: Item) => Promise<unknown>;
  getErrorMessage: (error: unknown) => string;
  onDeleted?: (item: Item) => void;
  successMessage: string;
};

export function useDelete<Item>({
  deleteItem,
  getErrorMessage,
  onDeleted,
  successMessage,
}: UseDeleteParams<Item>) {
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const requestDelete = (item: Item) => {
    setDeleteError("");
    setDeleteSuccess("");
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) setIsDeleteDialogOpen(false);
  };

  const clearDeleteDialog = () => {
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleteError("");
    setDeleteSuccess("");
    setIsDeleting(true);

    try {
      await deleteItem(itemToDelete);
      onDeleted?.(itemToDelete);
      setDeleteSuccess(successMessage);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const clearDeleteFeedback = () => {
    setDeleteError("");
    setDeleteSuccess("");
  };

  return {
    clearDeleteDialog,
    clearDeleteFeedback,
    closeDeleteDialog,
    confirmDelete,
    deleteError,
    deleteSuccess,
    isDeleteDialogOpen,
    isDeleting,
    itemToDelete,
    requestDelete,
  };
}
