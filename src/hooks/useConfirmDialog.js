import {
  useRef,
  useState
} from "react";

const INITIAL_DIALOG = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancel·lar",
  destructive: false
};

export default function useConfirmDialog() {
  const [
    confirmDialog,
    setConfirmDialog
  ] = useState(INITIAL_DIALOG);

  const confirmActionRef =
    useRef(null);

  function openConfirmDialog({
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancel·lar",
    destructive = false,
    onConfirm
  }) {
    confirmActionRef.current =
      onConfirm;

    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive
    });
  }

  function closeConfirmDialog() {
    confirmActionRef.current = null;

    setConfirmDialog(
      (currentDialog) => ({
        ...currentDialog,
        open: false
      })
    );
  }

  function confirmDialogAction() {
    const pendingAction =
      confirmActionRef.current;

    closeConfirmDialog();

    if (
      typeof pendingAction ===
      "function"
    ) {
      pendingAction();
    }
  }

  return {
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    confirmDialogAction
  };
}
