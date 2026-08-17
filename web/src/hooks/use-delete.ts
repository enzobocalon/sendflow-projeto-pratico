import { useState } from "react";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import { openDeleteDialog } from "@/facades/delete.facade";
import { useDialog } from "@/providers/dialog/dialog-context";
import { useFeedback } from "@/providers/feedback/use-feedback";

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
  const { showError, showSuccess } = useFeedback();
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (item: Item) => {
    setIsDeleting(true);

    try {
      await handleDelete(item.id);
      onDeleted?.(item);
      showSuccess("Exclusão concluída com sucesso.");
      return true;
    } catch (error) {
      showError(
        getBusinessRuleErrorMessage(
          error,
          "Não foi possível concluir a exclusão.",
        ),
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = (item: Item) => {
    openDeleteDialog({
      confirmationMessage,
      handleConfirm: confirmDelete,
      item,
      openDialog,
    });
  };

  return {
    state: { isDeleting },
    actions: { requestDelete },
  };
}
