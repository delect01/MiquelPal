import { useEffect, useState } from "react";
import SeparatorPreview from "./SeparatorPreview.jsx";

const STORAGE_KEY = "pallet-simulator-separator-library";

function loadLibrary() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("No s'ha pogut carregar la biblioteca de separadors:", error);
    return [];
  }
}

function saveLibrary(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("No s'ha pogut guardar la biblioteca de separadors:", error);
    return false;
  }
}

function emptyForm() {
  return {
    name: "",
    width: 800,
    depth: 1200,
    height: 5,
    color: "#d4b483",
    modelType: "BOX",
    modelData: null
  };
}

export default function SeparatorDialog({
  open,
  onClose,
  onCreateSeparator,
  t
}) {
  const [form, setForm] = useState(emptyForm);
  const [library, setLibrary] = useState(loadLibrary);
  const [selectedId, setSelectedId] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(emptyForm());
    setLibrary(loadLibrary());
    setSelectedId("");
    setFeedback("");
  }, [open]);

  if (!open) {
    return null;
  }

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setFeedback("");
  }

  function validatedDefinition() {
    const width = Number(form.width);
    const depth = Number(form.depth);
    const height = Number(form.height);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(depth) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      depth <= 0 ||
      height <= 0
    ) {
      setFeedback(
        t.separatorDialog.invalidDimensions
      );
      return null;
    }

    return {
      name: form.name.trim(),
      width,
      depth,
      height,
      color: form.color || "#d4b483",
      modelType: form.modelType || "BOX",
      modelData: form.modelData || null
    };
  }

  function handleSaveTemplate() {
    const definition = validatedDefinition();

    if (!definition) {
      return;
    }

    if (!definition.name) {
      setFeedback(t.separatorDialog.nameRequired);
      return;
    }

    const existing = library.find(
      (item) =>
        item.name.toLowerCase() ===
        definition.name.toLowerCase()
    );

    const item = {
      ...definition,
      id:
        existing?.id ||
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`
    };

    const next = existing
      ? library.map((candidate) =>
          candidate.id === existing.id
            ? item
            : candidate
        )
      : [...library, item];

    if (!saveLibrary(next)) {
      setFeedback(t.separatorDialog.saveError);
      return;
    }

    setLibrary(next);
    setSelectedId(item.id);
    setFeedback(
      existing
        ? t.separatorDialog.separatorUpdated
        : t.separatorDialog.separatorSaved
    );
  }

  function handleSelect(id) {
    setSelectedId(id);

    const item = library.find(
      (candidate) => candidate.id === id
    );

    if (!item) {
      return;
    }

    setForm({
      name: item.name || "",
      width: Number(item.width),
      depth: Number(item.depth),
      height: Number(item.height),
      color: item.color || "#d4b483",
      modelType: item.modelType || "BOX",
      modelData: item.modelData || null
    });

    setFeedback(t.separatorDialog.loaded(item.name));
  }

  function handleDeleteTemplate() {
    if (!selectedId) {
      return;
    }

    const next = library.filter(
      (item) => item.id !== selectedId
    );

    if (!saveLibrary(next)) {
      setFeedback(t.separatorDialog.deleteError);
      return;
    }

    setLibrary(next);
    setSelectedId("");
    setFeedback(t.separatorDialog.deletedFromLibrary);
  }

  function handleCreate() {
    const definition = validatedDefinition();

    if (!definition) {
      return;
    }

    onCreateSeparator(definition);
    onClose();
  }

  const sectionStyle = {
    padding: "12px",
    border: "1px solid #d7dce1",
    borderRadius: "7px",
    background: "#ffffff"
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    alignItems: "center",
    gap: "8px",
    marginBottom: "9px",
    color: "#404850",
    fontSize: "13px",
    fontWeight: 600
  };

  const inputStyle = {
    width: "100%",
    height: "34px",
    boxSizing: "border-box",
    padding: "0 8px",
    border: "1px solid #aeb6bf",
    borderRadius: "5px",
    background: "#ffffff",
    color: "#20262c"
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.separatorDialog.createSeparator}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(20, 25, 30, 0.72)"
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "min(1040px, 96vw)",
          maxHeight: "94vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: "18px",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.35)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "14px"
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              {t.separatorDialog.title}
            </h2>
            <div
              style={{
                marginTop: "4px",
                color: "#59636e",
                fontSize: "13px"
              }}
            >
              {t.separatorDialog.subtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.separatorDialog.close}
            style={{
              width: "38px",
              height: "38px",
              border: "1px solid #b8c0c8",
              borderRadius: "50%",
              background: "#f4f6f8",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(300px, 360px) minmax(420px, 1fr)",
            gap: "16px",
            alignItems: "start"
          }}
        >
          <div>
        <section
          style={{
            ...sectionStyle,
            marginBottom: "12px"
          }}
        >
          <h3 style={{ margin: "0 0 9px 0", fontSize: "16px" }}>
              {t.separatorDialog.library}
            </h3>

          <select
            value={selectedId}
            onChange={(event) => {
              handleSelect(event.target.value);
            }}
            style={{
              width: "100%",
              height: "36px",
              padding: "0 8px",
              border: "1px solid #aeb6bf",
              borderRadius: "5px",
              background: "#ffffff"
            }}
          >
            <option value="" disabled>
              {t.separatorDialog.list}
            </option>

            {[...library]
              .sort((itemA, itemB) =>
                itemA.name.localeCompare(
                  itemB.name,
                  "ca",
                  { sensitivity: "base" }
                )
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "10px"
            }}
          >
            <button
              type="button"
              onClick={handleDeleteTemplate}
              disabled={!selectedId}
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "1px solid #b02a37",
                borderRadius: "5px",
                background: selectedId ? "#ffffff" : "#eceff2",
                color: selectedId ? "#b02a37" : "#7b848d",
                cursor: selectedId ? "pointer" : "not-allowed"
              }}
            >
              {t.separatorDialog.deleteTemplate}
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedback(
                  t.separatorDialog.importLater
                );
              }}
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "1px solid #2767c5",
                borderRadius: "5px",
                background: "#ffffff",
                color: "#2767c5",
                cursor: "pointer"
              }}
            >
              {t.separatorDialog.import3D}
            </button>
          </div>
        </section>


            <section style={sectionStyle}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              {t.separatorDialog.characteristics}
            </h3>

            <label style={rowStyle}>
              {t.common.name}
            <input
                value={form.name}
                onChange={(event) => {
                  update("name", event.target.value);
                }}
                style={inputStyle}
              />
            </label>

            <label style={rowStyle}>
              {t.separatorDialog.widthX}
            <input
                type="number"
                min="1"
                value={form.width}
                onChange={(event) => {
                  update("width", event.target.value);
                }}
                style={inputStyle}
              />
            </label>

            <label style={rowStyle}>
              {t.separatorDialog.depthY}
            <input
                type="number"
                min="1"
                value={form.depth}
                onChange={(event) => {
                  update("depth", event.target.value);
                }}
                style={inputStyle}
              />
            </label>

            <label style={rowStyle}>
              {t.separatorDialog.thicknessZ}
            <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.height}
                onChange={(event) => {
                  update("height", event.target.value);
                }}
                style={inputStyle}
              />
            </label>

            <label style={rowStyle}>
              {t.separatorDialog.color}
            <input
                type="color"
                value={form.color}
                onChange={(event) => {
                  update("color", event.target.value);
                }}
                style={{
                  ...inputStyle,
                  padding: "2px"
                }}
              />
            </label>

            <button
              type="button"
              onClick={handleSaveTemplate}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderRadius: "6px",
                background: "#2767c5",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {t.separatorDialog.saveCharacteristics}
            </button>

            {feedback && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px",
                  borderRadius: "5px",
                  background: "#eef4fb",
                  color: "#244d7c",
                  fontSize: "13px"
                }}
              >
                {feedback}
              </div>
            )}
            </section>
          </div>

          <section>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                color: "#303840"
              }}
            >
              {t.separatorDialog.preview3D}
            </h3>

            <SeparatorPreview
              width={form.width}
              depth={form.depth}
              height={form.height}
              color={form.color}
            />

            <div
              style={{
                marginTop: "9px",
                padding: "9px",
                borderRadius: "6px",
                background: "#eef4fb",
                color: "#244d7c",
                fontSize: "12px",
                lineHeight: 1.45
              }}
            >
              {t.separatorDialog.previewHelp}
            </div>
          </section>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid #d7dce1"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              border: "1px solid #9ea7b0",
              borderRadius: "6px",
              background: "#ffffff",
              cursor: "pointer"
            }}
          >
              {t.common.cancel}
            </button>

          <button
            type="button"
            onClick={handleCreate}
            style={{
              padding: "10px 22px",
              border: "none",
              borderRadius: "6px",
              background: "#168447",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
              {t.separatorDialog.createSeparator}
            </button>
        </div>
      </div>
    </div>
  );
}
