export default function LayerOrderIdErrorDialog({
  open,
  message,
  onAccept,
  t
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        t?.orderIds?.errorAria ??
        "Error d’identificadors"
      }
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(20, 25, 30, 0.72)"
      }}
    >
      <div
        style={{
          width: "min(520px, 94vw)",
          boxSizing: "border-box",
          padding: "18px",
          border: "1px solid #d5a4a9",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow:
            "0 18px 60px rgba(0, 0, 0, 0.35)"
        }}
      >
        <h2
          style={{
            margin: "0 0 10px 0",
            color: "#b02a37",
            fontSize: "20px"
          }}
        >
          {t?.layer?.idErrorTitle ??
            "No es pot guardar la capa"}
        </h2>

        <div
          style={{
            padding: "11px",
            borderRadius: "6px",
            background: "#fff0f1",
            color: "#5f252b",
            fontSize: "14px",
            lineHeight: 1.55,
            whiteSpace: "pre-line"
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid #d7dce1"
          }}
        >
          <button
            type="button"
            onClick={onAccept}
            style={{
              minWidth: "110px",
              height: "36px",
              border: "none",
              borderRadius: "6px",
              background: "#2767c5",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {t?.common?.accept ??
            "Acceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}
