import {
  useEffect,
  useRef,
  useState
} from "react";

function translated(
  value,
  fallback
) {
  return (
    typeof value === "string" &&
    value.trim()
      ? value
      : fallback
  );
}

export default function ProjectMenu({
  projectName,
  hasUnsavedChanges,
  autosaveFailed = false,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExportProject,
  onImportFile,
  onExportBackup,
  t
}) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);
  const menuContainerRef =
    useRef(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        !menuContainerRef.current ||
        menuContainerRef.current.contains(
          event.target
        )
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

  function executeMenuAction(action) {
    setIsMenuOpen(false);
    action();
  }

  const labels = {
    menu: translated(
      t?.projectMenu?.title,
      "Projecte"
    ),
    unsaved: translated(
      t?.projectMenu?.unsaved,
      "Canvis sense guardar"
    ),
    saved: translated(
      t?.projectMenu?.saved,
      "Projecte guardat"
    ),
    newProject: translated(
      t?.projectMenu?.newProject,
      "Nou projecte"
    ),
    openProject: translated(
      t?.projectMenu?.openProject,
      "Obrir projecte"
    ),
    save: translated(
      t?.projectMenu?.save,
      "Guardar"
    ),
    saveAs: translated(
      t?.projectMenu?.saveAs,
      "Guardar com a..."
    ),
    exportProject: translated(
      t?.projectMenu?.exportProject,
      "Exportar projecte..."
    ),
    importFile: translated(
      t?.projectMenu?.importFile,
      "Importar fitxer..."
    ),
    exportBackup: translated(
      t?.projectMenu?.exportBackup,
      "Còpia de seguretat..."
    )
  };

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
            border: "1px solid #2767c5",
            borderRadius: "6px",
            background: "#2767c5",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {labels.menu}
          <span style={{ marginLeft: "7px" }}>
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
              color: hasUnsavedChanges
                ? "#b36b00"
                : "#66717c"
            }}
          >
            {hasUnsavedChanges
              ? labels.unsaved
              : labels.saved}
          </div>
        </div>
      </div>

      {/* La còpia de recuperació no s'ha pogut desar: cal guardar el projecte */}
      {autosaveFailed && hasUnsavedChanges && (
        <div
          role="alert"
          style={{
            marginTop: "8px",
            padding: "7px 9px",
            borderRadius: "5px",
            background: "#fff0f1",
            color: "#b02a37",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.35
          }}
        >
          {t.project.autosaveFailed}
        </div>
      )}

      {isMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: 0,
            zIndex: 2000,
            width: "190px",
            padding: "5px",
            border: "1px solid #c6ccd2",
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
            {labels.newProject}
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
            {labels.openProject}
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
            {labels.save}
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
            {labels.saveAs}
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
                onExportProject
              );
            }}
            style={menuItemStyle}
          >
            {labels.exportProject}
          </button>

          <button
            type="button"
            onClick={() => {
              executeMenuAction(() =>
                importInputRef.current?.click()
              );
            }}
            style={menuItemStyle}
          >
            {labels.importFile}
          </button>

          <button
            type="button"
            onClick={() => {
              executeMenuAction(
                onExportBackup
              );
            }}
            style={menuItemStyle}
          >
            {labels.exportBackup}
          </button>
        </div>
      )}

      {/* Projecte (.miquelpal.json) o còpia de seguretat */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        data-import-file
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (file) {
            onImportFile(file);
          }
        }}
      />
    </div>
  );
}
