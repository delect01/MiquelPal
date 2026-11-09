//confirm dialog

import {
  useEffect
} from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancel·lar",
  destructive = false,
  onConfirm,
  onCancel,
  secondaryLabel = null,
  onSecondary
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event
    ) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onCancel
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background:
          "rgba(20, 25, 30, 0.72)"
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          width:
            "min(460px, 92vw)",
          boxSizing: "border-box",
          padding: "18px",
          border:
            "1px solid #c6ccd2",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow:
            "0 18px 60px rgba(0, 0, 0, 0.35)"
        }}
      >
        <h2
          style={{
            margin: "0 0 9px 0",
            color: destructive
              ? "#a1262f"
              : "#303840",
            fontSize: "20px"
          }}
        >
          {title}
        </h2>

        <div
          style={{
            color: "#59636e",
            fontSize: "14px",
            lineHeight: 1.5
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: "8px",
            marginTop: "20px",
            paddingTop: "12px",
            borderTop:
              "1px solid #d7dce1"
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding:
                "9px 16px",
              border:
                "1px solid #9ea7b0",
              borderRadius: "6px",
              background: "#ffffff",
              color: "#303840",
              cursor: "pointer"
            }}
          >
            {cancelLabel}
          </button>

          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                padding:
                  "9px 16px",
                border:
                  "1px solid #2767c5",
                borderRadius: "6px",
                background: "#ffffff",
                color: "#2767c5",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding:
                "9px 18px",
              border: "none",
              borderRadius: "6px",
              background: destructive
                ? "#b02a37"
                : "#2767c5",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}