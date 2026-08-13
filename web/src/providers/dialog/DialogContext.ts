import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { DialogProps } from "@mui/material/Dialog";

export interface OpenDialogOptions extends Omit<
  DialogProps,
  "children" | "onClose" | "open"
> {
  children: ReactNode;
}

interface DialogContextValue {
  closeDialog: () => void;
  openDialog: (options: OpenDialogOptions) => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }

  return context;
}
