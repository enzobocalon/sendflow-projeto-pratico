import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";

import { DialogContext } from "./dialog-context";
import type { OpenDialogOptions } from "./dialog-context";

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider(props: DialogProviderProps) {
  const { children } = props;
  const [dialog, setDialog] = useState<OpenDialogOptions | null>(null);

  const openDialog = useCallback((options: OpenDialogOptions) => {
    setDialog(options);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const { children: dialogContent, ...dialogProps } = dialog ?? {
    children: null,
  };

  return (
    <DialogContext.Provider value={{ closeDialog, openDialog }}>
      {children}
      <Dialog open={Boolean(dialog)} onClose={closeDialog} {...dialogProps}>
        {dialogContent}
      </Dialog>
    </DialogContext.Provider>
  );
}
