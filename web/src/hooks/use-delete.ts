import { useState } from "react";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import { openDeleteDialog } from "@/facades/delete.facade";
import { useDialog } from "@/providers/dialog/dialog-context";
import type { Feedback } from "@/utils/feedback";

interface IdentifiableItem {
  id: string;
}

interface UseDeleteParams<Item extends IdentifiableItem> {
  confirmationMessage: string | ((item: Item) => string);
  handleDelete: (id: string) => Promise<unknown>;
  onDeleted?: (item: Item) => void;
}

export function useDelete<Item extends IdentifiableItem>(
  params: UseDeleteParams<Item>,
) {
  const { confirmationMessage, handleDelete, onDeleted } = params;
  const { openDialog } = useDialog();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (item: Item) => {
    setFeedback(null);
    setIsDeleting(true);

    try {
      await handleDelete(item.id);
      onDeleted?.(item);
      setFeedback({
        message: "Exclusão concluída com sucesso.",
        severity: "success",
      });
      return true;
    } catch (error) {
      setFeedback({
        message: getBusinessRuleErrorMessage(
          error,
          "Não foi possível concluir a exclusão.",
        ),
        severity: "error",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = (item: Item) => {
    setFeedback(null);
    openDeleteDialog({
      confirmationMessage,
      handleConfirm: confirmDelete,
      item,
      openDialog,
    });
  };

  const clearFeedback = () => setFeedback(null);

  return {
    state: { feedback, isDeleting },
    actions: { clearFeedback, requestDelete },
  };
}
