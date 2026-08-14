import { DeleteDialog } from "@/components/delete-dialog";
import type { OpenDialogOptions } from "@/providers/dialog";

interface OpenDeleteDialogParams<Item> {
  confirmationMessage: string | ((item: Item) => string);
  handleConfirm: (item: Item) => Promise<boolean>;
  item: Item;
  openDialog: (options: OpenDialogOptions) => void;
}

export function openDeleteDialog<Item>(params: OpenDeleteDialogParams<Item>) {
  const { confirmationMessage, handleConfirm, item, openDialog } = params;
  const message =
    typeof confirmationMessage === "function"
      ? confirmationMessage(item)
      : confirmationMessage;

  openDialog({
    fullWidth: true,
    maxWidth: "xs",
    children: (
      <DeleteDialog
        title="Confirmar exclusão"
        message={message}
        onConfirm={() => handleConfirm(item)}
      />
    ),
  });
}
