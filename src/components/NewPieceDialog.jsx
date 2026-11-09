import { useCallback, useEffect, useState } from "react";
import { PIECE_CONFIG } from "../Config/geometryConfig";
import PiecePreview from "./PiecePreview";
import Import3DButton from "./Import3DButton.jsx";
import { MODEL_BOTTOM_FACES } from "../utils/modelLoader.js";
import NumericInput from "./NumericInput.jsx";
import { loadPieceLibrary, savePieceLibrary } from "../utils/pieceLibrary.js";
import { getPieceGeometryVersion } from "../utils/conveyorConfigurations.js";

function getInitialForm() {
  return {
    name: "",
    pieceType: "RECTANGULAR",
    width: PIECE_CONFIG.width,
    height: PIECE_CONFIG.height,
    depth: PIECE_CONFIG.depth,
    topWidth: PIECE_CONFIG.topWidth ?? PIECE_CONFIG.width,
    topDepth: PIECE_CONFIG.topDepth ?? PIECE_CONFIG.depth,
    modelId: null,
    modelName: null,
    modelFormat: null,
    modelUnit: null,
    modelBottomFace: "NEGATIVE_Y"
  };
}

// Formulari a partir d'una peça existent (mode edició)
function getFormFromPiece(piece) {
  return {
    ...getInitialForm(),
    name: piece.name ?? "",
    pieceType: piece.pieceType,
    width: piece.width,
    height: piece.height,
    depth: piece.depth,
    topWidth: piece.topWidth ?? piece.width,
    topDepth: piece.topDepth ?? piece.depth,
    modelId: piece.modelId ?? null,
    modelName: piece.modelName ?? null,
    modelFormat: piece.modelFormat ?? null,
    modelUnit: piece.modelUnit ?? null,
    modelBottomFace: piece.modelBottomFace ?? "NEGATIVE_Y"
  };
}

function Field({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontWeight: 600 }}>
      {label}
      {type === "number" ? (
        <NumericInput
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{ height: "34px", padding: "0 8px", border: "1px solid #aeb6bf", borderRadius: "5px" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          style={{ height: "34px", padding: "0 8px", border: "1px solid #aeb6bf", borderRadius: "5px" }}
        />
      )}
    </label>
  );
}

/*
  Nova peça / Editar peça.

  En mode edició (editingPiece) només es pot canviar el
  nom: la geometria d'una peça ja col·locada no es toca.

  requestPieceDeletion(id, nom, eliminar): demana
  confirmació si la peça té configuració de cinta i, si
  s'accepta, elimina la peça i la seva configuració.
*/
export default function NewPieceDialog({
  open,
  onClose,
  onCreatePiece,
  editingPiece = null,
  onUpdatePiece,
  editingLibraryPiece = null,
  requestPieceDeletion = (id, name, deletePiece) => deletePiece(),
  t
}) {
  const [form, setForm] = useState(getInitialForm);
  const [savedPieces, setSavedPieces] = useState(loadPieceLibrary);
  const [selectedSavedPieceId, setSelectedSavedPieceId] = useState("");
  const [feedback, setFeedback] = useState("");
  // Edició d'una peça que no és a la biblioteca: desar-la-hi (per defecte, sí)
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const isEditing = Boolean(editingPiece);
  const editingPieceId = editingPiece?.id ?? null;

  useEffect(() => {
    if (!open) return;
    setForm(editingPiece ? getFormFromPiece(editingPiece) : getInitialForm());
    setSavedPieces(loadPieceLibrary());
    setSelectedSavedPieceId("");
    setFeedback("");
    setSaveToLibrary(true);
    // Només en obrir o en canviar de peça
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPieceId]);

  const imported = form.pieceType === "IMPORTED_3D" && form.modelId;

  const update = (field, value) => {
    setFeedback("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImportedDimensions = useCallback((dimensions) => {
    setForm((current) => {
      if (current.pieceType !== "IMPORTED_3D") return current;
      return {
        ...current,
        ...dimensions,
        topWidth: dimensions.width,
        topDepth: dimensions.depth
      };
    });
  }, []);

  function validatedData() {
    const numeric = {
      width: Number(form.width),
      height: Number(form.height),
      depth: Number(form.depth),
      topWidth: form.pieceType === "TRAPEZOIDAL" ? Number(form.topWidth) : Number(form.width),
      topDepth: form.pieceType === "TRAPEZOIDAL" ? Number(form.topDepth) : Number(form.depth)
    };

    if (Object.values(numeric).some((value) => !Number.isFinite(value) || value <= 0)) {
      setFeedback(t.pieceDialog.invalidDimensions);
      return null;
    }

    return { ...form, ...numeric, name: form.name.trim() };
  }

  function saveTemplate() {
    const data = validatedData();
    if (!data) return;
    if (!data.name) {
      setFeedback(t.pieceDialog.nameRequired);
      return;
    }

    const existing = savedPieces.find(
      (item) => item.name.toLowerCase() === data.name.toLowerCase()
    );
    const saved = {
      ...data,
      id: existing?.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    };
    const next = existing
      ? savedPieces.map((item) => item.id === existing.id ? saved : item)
      : [...savedPieces, saved];

    // La llista només canvia si s'ha pogut desar
    if (!savePieceLibrary(next)) {
      setFeedback(t.pieceDialog.saveError);
      return;
    }

    setSavedPieces(next);
    setSelectedSavedPieceId(saved.id);
    setFeedback(existing ? t.pieceDialog.templateUpdated : t.pieceDialog.templateSaved);
  }

  function selectTemplate(id) {
    setSelectedSavedPieceId(id);
    const selected = savedPieces.find((item) => item.id === id);
    if (selected) setForm({ ...getInitialForm(), ...selected });
  }

  function deleteTemplate() {
    if (!selectedSavedPieceId) return;

    const pieceId = selectedSavedPieceId;
    const pieceName =
      savedPieces.find((item) => item.id === pieceId)?.name ?? "";

    // Si té configuració de cinta, s'avisa i s'eliminen totes dues
    requestPieceDeletion(pieceId, pieceName, () => {
      const next = loadPieceLibrary().filter((item) => item.id !== pieceId);

      if (!savePieceLibrary(next)) {
        setFeedback(t.pieceDialog.saveError);
        return;
      }

      setSavedPieces(next);
      setSelectedSavedPieceId("");
      setForm(getInitialForm());
      setFeedback(t.pieceDialog.templateDeleted);
    });
  }

  function createPiece() {
    const data = validatedData();
    if (!data) return;

    if (isEditing) {
      const result = onUpdatePiece(
        editingPiece.id,
        { name: data.name || editingPiece.name },
        { saveToLibrary: !editingLibraryPiece && saveToLibrary }
      );

      // P. ex. el nom ja el té una altra peça de la biblioteca
      if (result?.error) {
        setFeedback(result.error);
      }
      return;
    }

    // Vincle amb la plantilla si la geometria no s'ha tocat
    const template = savedPieces.find((item) => item.id === selectedSavedPieceId);
    const libraryPieceId =
      template &&
      getPieceGeometryVersion(template) === getPieceGeometryVersion(data)
        ? template.id
        : null;

    onCreatePiece({ ...data, libraryPieceId });
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(20,25,30,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "24px"
    }}>
      <div style={{ width: "min(920px,94vw)", maxHeight: "90vh", overflowY: "auto", background: "white", borderRadius: "10px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {isEditing ? t.pieceDialog.editTitle : t.pieceDialog.title}
            </h2>
            <div style={{ marginTop: "5px", color: "#59636e" }}>
              {isEditing ? t.pieceDialog.editSubtitle : t.pieceDialog.subtitle}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: "38px", height: "38px", borderRadius: "50%" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,360px) minmax(360px,1fr)", gap: "16px" }}>
          <div>
            {!isEditing && (
            <section style={{ padding: "12px", border: "1px solid #d7dce1", borderRadius: "7px", marginBottom: "10px" }}>
              <h3 style={{ marginTop: 0 }}>
              {t.pieceDialog.library}
            </h3>
              <select value={selectedSavedPieceId} onChange={(event) => selectTemplate(event.target.value)} style={{ width: "100%", height: "36px" }}>
                <option value="" disabled>
              {t.pieceDialog.list}
            </option>
                {[...savedPieces].sort((a, b) => a.name.localeCompare(b.name, "ca")).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button type="button" onClick={deleteTemplate} disabled={!selectedSavedPieceId} style={{ flex: 1 }}>
              {t.pieceDialog.deleteTemplate}
            </button>
                <Import3DButton
                  t={t}
                  onImported={(importedPiece) => {
                    setForm({ ...getInitialForm(), ...importedPiece });
                    setSelectedSavedPieceId("");
                    setFeedback(t.pieceDialog.modelImported);
                  }}
                />
              </div>
            </section>
            )}

            <section style={{ padding: "12px", border: "1px solid #d7dce1", borderRadius: "7px" }}>
              <h3 style={{ marginTop: 0 }}>
              {t.pieceDialog.characteristics}
            </h3>
              <Field label={t.pieceDialog.pieceName} value={form.name} onChange={(value) => update("name", value)} />

              {/* Editar una peça que no és a la biblioteca: es pregunta si s'hi vol desar */}
              {isEditing && !editingLibraryPiece && (
                <div style={{ marginTop: "12px", padding: "9px 10px", border: "1px solid #f0c36d", borderRadius: "6px", background: "#fff8e6", color: "#6b4a00", fontSize: "13px", textAlign: "left" }}>
                  <div style={{ fontWeight: 700 }}>{t.pieceDialog.notInLibrary}</div>
                  <label style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={saveToLibrary}
                      onChange={(event) => setSaveToLibrary(event.target.checked)}
                    />
                    {t.pieceDialog.saveToLibrary}
                  </label>
                </div>
              )}

              {imported ? (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontWeight: 600, marginTop: "12px" }}>
              {t.pieceDialog.bottomFace}
            <select
                      value={form.modelBottomFace}
                      onChange={(event) => update("modelBottomFace", event.target.value)}
                      disabled={isEditing}
                      style={{ height: "36px", border: "1px solid #aeb6bf", borderRadius: "5px" }}
                    >
                      {MODEL_BOTTOM_FACES.map((face) => (
                        <option key={face.value} value={face.value}>
                          {t.pieceDialog.bottomFaces[face.value] ?? face.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div style={{ marginTop: "12px", padding: "9px", background: "#eef4fb", borderRadius: "5px", color: "#244d7c" }}>
                    {t.pieceDialog.model}: {form.modelName}<br />
                    {t.pieceDialog.calculatedDimensions}: {Number(form.width).toFixed(2)} × {Number(form.height).toFixed(2)} × {Number(form.depth).toFixed(2)} mm
                  </div>
                </>
              ) : (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontWeight: 600, marginTop: "12px" }}>
              {t.pieceDialog.pieceType}
            <select value={form.pieceType} onChange={(event) => update("pieceType", event.target.value)} disabled={isEditing} style={{ height: "36px" }}>
                      <option value="RECTANGULAR">{t.pieceDialog.rectangular}</option>
                      <option value="TRAPEZOIDAL">{t.pieceDialog.trapezoidal}</option>
                    </select>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "7px", marginTop: "12px" }}>
                    <Field type="number" label={t.pieceDialog.width} value={form.width} onChange={(value) => update("width", value)} disabled={isEditing} />
                    <Field type="number" label={t.pieceDialog.height} value={form.height} onChange={(value) => update("height", value)} disabled={isEditing} />
                    <Field type="number" label={t.pieceDialog.depth} value={form.depth} onChange={(value) => update("depth", value)} disabled={isEditing} />
                    {form.pieceType === "TRAPEZOIDAL" && (
                      <>
                        <Field type="number" label={t.pieceDialog.topWidth} value={form.topWidth} onChange={(value) => update("topWidth", value)} disabled={isEditing} />
                        <Field type="number" label={t.pieceDialog.topDepth} value={form.topDepth} onChange={(value) => update("topDepth", value)} disabled={isEditing} />
                      </>
                    )}
                  </div>
                </>
              )}

              {!isEditing && (
              <button type="button" onClick={saveTemplate} style={{ width: "100%", marginTop: "16px", padding: "10px", background: "#2767c5", color: "white", border: 0, borderRadius: "6px" }}>
              {t.pieceDialog.saveCharacteristics}
            </button>
              )}
              {feedback && <div style={{ marginTop: "12px", padding: "9px", background: "#eef4fb", color: "#244d7c" }}>{feedback}</div>}
            </section>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>
              {t.pieceDialog.preview3D}
            </h3>
            <PiecePreview
              {...form}
              onImportedDimensions={handleImportedDimensions}
            />
            <div style={{ marginTop: "10px", color: "#59636e", fontSize: "14px" }}>

            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #d7dce1" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px" }}>
              {t.common.cancel}
            </button>
          <button type="button" onClick={createPiece} style={{ padding: "10px 22px", background: "#168447", color: "white", border: 0, borderRadius: "6px", fontWeight: 700 }}>
              {isEditing ? t.pieceDialog.saveChanges : t.pieceDialog.createPiece}
            </button>
        </div>
      </div>
    </div>
  );
}
