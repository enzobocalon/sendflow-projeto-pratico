import { useState } from "react";

import { DeleteDialog } from "@/components/delete-dialog";
import { useDialog } from "@/providers/dialog";
import type { Feedback } from "@/utils/feedback";

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
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (item: Item) => {
    setFeedback(null);
    setIsDeleting(true);

    try {
      await deleteItem(item);
      onDeleted?.(item);
      setFeedback({ message: successMessage, severity: "success" });
      return true;
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), severity: "error" });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = (item: Item) => {
    setFeedback(null);

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

  const clearFeedback = () => setFeedback(null);

  return {
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete },
  };
}
