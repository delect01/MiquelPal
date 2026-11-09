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
  destructive: false,
  secondaryLabel: null
};

export default function useConfirmDialog() {
  const [
    confirmDialog,
    setConfirmDialog
  ] = useState(INITIAL_DIALOG);

  const confirmActionRef =
    useRef(null);

  // Acció opcional d'un tercer botó (entre cancel·lar i confirmar)
  const secondaryActionRef =
    useRef(null);

  function openConfirmDialog({
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancel·lar",
    destructive = false,
    onConfirm,
    secondaryLabel = null,
    onSecondary = null
  }) {
    confirmActionRef.current =
      onConfirm;

    secondaryActionRef.current =
      onSecondary;

    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive,
      secondaryLabel:
        onSecondary ? secondaryLabel : null
    });
  }

  function closeConfirmDialog() {
    confirmActionRef.current = null;
    secondaryActionRef.current = null;

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

  function confirmDialogSecondaryAction() {
    const pendingAction =
      secondaryActionRef.current;

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
    confirmDialogAction,
    confirmDialogSecondaryAction
  };
}
