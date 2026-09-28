//save project dialog


import {
  useEffect,
  useState
} from "react";

export default function SaveProjectDialog({
  open,
  initialName,
  onCancel,
  onSave
}) {
  const [
    projectName,
    setProjectName
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setProjectName(
      initialName ?? ""
    );

    setErrorMessage("");
  }, [
    open,
    initialName
  ]);

  if (!open) {
    return null;
  }

  function handleSave() {
    const cleanName =
      projectName.trim();

    if (!cleanName) {
      setErrorMessage(
        "Has d'escriure un nom per al projecte."
      );

      return;
    }

    onSave(cleanName);
  }

  function handleKeyDown(
    event
  ) {
    if (event.key === "Enter") {
      handleSave();
    }

    if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Guardar projecte"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
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
            "min(440px, 92vw)",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "12px",
            marginBottom: "16px"
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#303840",
                fontSize: "20px"
              }}
            >
              Guardar projecte
            </h2>

            <div
              style={{
                marginTop: "4px",
                color: "#66717c",
                fontSize: "13px"
              }}
            >
              Escriu un nom per a la composició actual.
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Tancar"
            style={{
              width: "36px",
              height: "36px",
              flexShrink: 0,
              border:
                "1px solid #b8c0c8",
              borderRadius: "50%",
              background: "#f4f6f8",
              color: "#303840",
              fontSize: "19px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "#404850",
            fontSize: "13px",
            fontWeight: 600
          }}
        >
          Nom del projecte

          <input
            type="text"
            autoFocus
            value={projectName}
            placeholder="Exemple: Stack client A"
            onChange={(event) => {
              setProjectName(
                event.target.value
              );

              setErrorMessage("");
            }}
            onKeyDown={
              handleKeyDown
            }
            style={{
              width: "100%",
              height: "36px",
              boxSizing:
                "border-box",
              padding: "0 9px",
              border:
                "1px solid #aeb6bf",
              borderRadius: "5px",
              color: "#20262c",
              fontSize: "14px"
            }}
          />
        </label>

        {errorMessage && (
          <div
            style={{
              marginTop: "10px",
              padding: "9px",
              borderRadius: "5px",
              background: "#fff0f0",
              color: "#a1262f",
              fontSize: "13px"
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: "8px",
            marginTop: "18px",
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
            Cancel·lar
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding:
                "9px 19px",
              border: "none",
              borderRadius: "6px",
              background: "#168447",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Guardar projecte
          </button>
        </div>
      </div>
    </div>
  );
}

