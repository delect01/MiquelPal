// project menu

import {
  useEffect,
  useRef,
  useState
} from "react";

export default function ProjectMenu({
  projectName,
  hasUnsavedChanges,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs
}) {
  const [
    isMenuOpen,
    setIsMenuOpen
  ] = useState(false);

  const menuContainerRef =
    useRef(null);

  useEffect(() => {
    function handlePointerDown(
      event
    ) {
      if (
        !menuContainerRef.current
      ) {
        return;
      }

      if (
        menuContainerRef.current
          .contains(event.target)
      ) {
        return;
      }

      setIsMenuOpen(false);
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, []);

  function executeMenuAction(
    action
  ) {
    setIsMenuOpen(false);
    action();
  }

  const menuItemStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "none",
    borderRadius: "4px",
    background: "#ffffff",
    color: "#303840",
    textAlign: "left",
    fontSize: "13px",
    cursor: "pointer"
  };

  return (
    <div
      ref={menuContainerRef}
      style={{
        position: "relative",
        marginBottom: "12px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(
              (currentValue) =>
                !currentValue
            );
          }}
          style={{
            height: "34px",
            padding: "0 12px",
            border:
              "1px solid #2767c5",
            borderRadius: "6px",
            background: "#2767c5",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Projecte
          <span
            style={{
              marginLeft: "7px"
            }}
          >
            ▼
          </span>
        </button>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            color: "#4f5870",
            fontSize: "12px",
            lineHeight: 1.3,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
            title={projectName}
          >
            {projectName}
          </div>

          <div
            style={{
              color:
                hasUnsavedChanges
                  ? "#b36b00"
                  : "#66717c"
            }}
          >
            {hasUnsavedChanges
              ? "Canvis sense guardar"
              : "Projecte guardat"}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: 0,
            zIndex: 2000,
            width: "190px",
            padding: "5px",
            border:
              "1px solid #c6ccd2",
            borderRadius: "7px",
            background: "#ffffff",
            boxShadow:
              "0 10px 26px rgba(0, 0, 0, 0.2)"
          }}
        >
          <button
            type="button"
            onClick={() => {
              executeMenuAction(
                onNewProject
              );
            }}
            style={menuItemStyle}
          >
            Nou projecte
          </button>

          <button
            type="button"
            onClick={() => {
              executeMenuAction(
                onOpenProject
              );
            }}
            style={menuItemStyle}
          >
            Obrir projecte
          </button>

          <div
            style={{
              height: "1px",
              margin: "5px 4px",
              background: "#d7dce1"
            }}
          />

          <button
            type="button"
            onClick={() => {
              executeMenuAction(
                onSaveProject
              );
            }}
            style={menuItemStyle}
          >
            Guardar
          </button>

          <button
            type="button"
            onClick={() => {
              executeMenuAction(
                onSaveProjectAs
              );
            }}
            style={menuItemStyle}
          >
            Guardar com a...
          </button>
        </div>
      )}
    </div>
  );
}