//New piece Dialog

import {
  useEffect,
  useState
} from "react";

import {
  PIECE_CONFIG
} from "../Config/geometryConfig";

import PiecePreview from "./PiecePreview";

const STORAGE_KEY =
  "pallet-simulator-piece-library";

function getInitialForm() {
  return {
    name: "",
    pieceType: "RECTANGULAR",

    width: PIECE_CONFIG.width,
    height: PIECE_CONFIG.height,
    depth: PIECE_CONFIG.depth,

    topWidth:
      PIECE_CONFIG.topWidth ??
      PIECE_CONFIG.width,

    topDepth:
      PIECE_CONFIG.topDepth ??
      PIECE_CONFIG.depth
  };
}

function loadSavedPieces() {
  try {
    const savedValue =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!savedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(savedValue);

    return Array.isArray(parsedValue)
      ? parsedValue
      : [];
  } catch (error) {
    console.error(
      "No s'ha pogut carregar la biblioteca de peces:",
      error
    );

    return [];
  }
}

function savePieceLibrary(
  pieces
) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(pieces)
  );
}

function NumericField({
  label,
  value,
  onChange,
  minimum = 1
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        fontWeight: 600
      }}
    >
      {label}

      <input
        type="number"
        min={minimum}
        step="1"
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        style={{
          height: "34px",
          padding: "0 8px",
          border:
            "1px solid #aeb6bf",
          borderRadius: "5px"
        }}
      />
    </label>
  );
}

export default function NewPieceDialog({
  open,
  onClose,
  onCreatePiece
}) {
  const [form, setForm] =
    useState(getInitialForm);

  const [
    savedPieces,
    setSavedPieces
  ] = useState(loadSavedPieces);

  const [
    selectedSavedPieceId,
    setSelectedSavedPieceId
  ] = useState("");

  const [
    feedbackMessage,
    setFeedbackMessage
  ] = useState("");

  /*
    Cada vegada que obrim la finestra,
    comencem amb una configuració neta.
  */
  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(getInitialForm());
    setSelectedSavedPieceId("");
    setFeedbackMessage("");
  }, [open]);

  if (!open) {
    return null;
  }

function updateFormField(
  field,
  newValue
) {
  setFeedbackMessage("");

  setForm((currentForm) => {
    if (field === "name") {
      return {
        ...currentForm,
        name: newValue
      };
    }

    if (field === "pieceType") {
      return {
        ...currentForm,
        pieceType: newValue
      };
    }

    if (field === "width") {
      return {
        ...currentForm,
        width: newValue
      };
    }

    if (field === "height") {
      return {
        ...currentForm,
        height: newValue
      };
    }

    if (field === "depth") {
      return {
        ...currentForm,
        depth: newValue
      };
    }

    if (field === "topWidth") {
      return {
        ...currentForm,
        topWidth: newValue
      };
    }

    if (field === "topDepth") {
      return {
        ...currentForm,
        topDepth: newValue
      };
    }

    return currentForm;
  });
}



  function updateNumericField(
    field,
    rawValue
  ) {
    if (rawValue === "") {
      updateFormField(
        field,
        ""
      );

      return;
    }

    const numericValue =
      Number(rawValue);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return;
    }

    updateFormField(
      field,
      numericValue
    );
  }

  function getValidatedPieceData() {
    const width =
      Number(form.width);

    const height =
      Number(form.height);

    const depth =
      Number(form.depth);

    const topWidth =
      form.pieceType ===
      "TRAPEZOIDAL"
        ? Number(form.topWidth)
        : width;

    const topDepth =
      form.pieceType ===
      "TRAPEZOIDAL"
        ? Number(form.topDepth)
        : depth;

    const numericValues = [
      width,
      height,
      depth,
      topWidth,
      topDepth
    ];

    const dimensionsAreValid =
      numericValues.every(
        (value) =>
          Number.isFinite(value) &&
          value > 0
      );

    if (!dimensionsAreValid) {
      setFeedbackMessage(
        "Totes les dimensions han de ser nombres superiors a zero."
      );

      return null;
    }

    return {
      name: form.name.trim(),
      pieceType:
        form.pieceType,

      width,
      height,
      depth,

      topWidth,
      topDepth
    };
  }

  function handleSaveTemplate() {
    const validatedData =
      getValidatedPieceData();

    if (!validatedData) {
      return;
    }

    if (!validatedData.name) {
      setFeedbackMessage(
        "Has d'escriure un nom abans de guardar la peça."
      );

      return;
    }

    const normalizedName =
      validatedData.name
        .toLowerCase();

    const existingPiece =
      savedPieces.find(
        (savedPiece) =>
          savedPiece.name
            .toLowerCase() ===
          normalizedName
      );

    let updatedLibrary;

    if (existingPiece) {
      /*
        Si ja existeix una plantilla amb
        el mateix nom, n'actualitzem les
        característiques.
      */
      updatedLibrary =
        savedPieces.map(
          (savedPiece) =>
            savedPiece.id ===
            existingPiece.id
              ? {
                  ...validatedData,
                  id: existingPiece.id
                }
              : savedPiece
        );
    } else {
      const newTemplate = {
        ...validatedData,
        id:
          window.crypto
            ?.randomUUID?.() ??
          `${Date.now()}-${Math.random()}`
      };

      updatedLibrary = [
        ...savedPieces,
        newTemplate
      ];
    }

    setSavedPieces(
      updatedLibrary
    );

    savePieceLibrary(
      updatedLibrary
    );

    setFeedbackMessage(
      existingPiece
        ? "La plantilla s'ha actualitzat correctament."
        : "La plantilla s'ha guardat correctament."
    );
  }

  function handleSelectSavedPiece(
    savedPieceId
  ) {
    setSelectedSavedPieceId(
      savedPieceId
    );

    const savedPiece =
      savedPieces.find(
        (candidate) =>
          candidate.id ===
          savedPieceId
      );

    if (!savedPiece) {
      return;
    }

    setForm({
      name: savedPiece.name,
      pieceType:
        savedPiece.pieceType,

      width:
        savedPiece.width,

      height:
        savedPiece.height,

      depth:
        savedPiece.depth,

      topWidth:
        savedPiece.topWidth ??
        savedPiece.width,

      topDepth:
        savedPiece.topDepth ??
        savedPiece.depth
    });

    setFeedbackMessage(
      `Plantilla carregada: ${savedPiece.name}`
    );
  }

  function handleDeleteTemplate() {
    if (!selectedSavedPieceId) {
      setFeedbackMessage(
        "Selecciona una plantilla abans d'eliminar-la."
      );

      return;
    }

    const updatedLibrary =
      savedPieces.filter(
        (savedPiece) =>
          savedPiece.id !==
          selectedSavedPieceId
      );

    setSavedPieces(
      updatedLibrary
    );

    savePieceLibrary(
      updatedLibrary
    );

    setSelectedSavedPieceId("");
    setForm(getInitialForm());

    setFeedbackMessage(
      "La plantilla s'ha eliminat."
    );
  }

  function handleCreatePiece() {
    const validatedData =
      getValidatedPieceData();

    if (!validatedData) {
      return;
    }

    onCreatePiece(
      validatedData
    );
  }

  const previewWidth =
    Number(form.width) || 1;

  const previewHeight =
    Number(form.height) || 1;

  const previewDepth =
    Number(form.depth) || 1;

  const previewTopWidth =
    Number(form.topWidth) ||
    previewWidth;

  const previewTopDepth =
    Number(form.topDepth) ||
    previewDepth;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crear una nova peça"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background:
          "rgba(20, 25, 30, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "min(920px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "10px",
          boxShadow:
            "0 18px 60px rgba(0, 0, 0, 0.35)",
          padding: "16px"
        }}
      >
        <div
          style={{
        display: "flex",
        justifyContent:"space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px"
        }}

        >
          <div>
            <h2
              style={{
                margin: 0
              }}
            >
              Nova peça
            </h2>

            <div
              style={{
                marginTop: "5px",
                color: "#59636e"
              }}
            >
              Defineix la geometria o
              carrega una peça guardada.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tancar"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border:
                "1px solid #b8c0c8",
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
                "minmax(280px, 360px) minmax(360px, 1fr)",
            gap: "16px"
            }}
        >
          <div>
            <section
              style={{
                    padding: "12px",
                    border:
                        "1px solid #d7dce1",
                    borderRadius: "7px",
                    marginBottom: "10px"
                }}

            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                Biblioteca de peces
              </h3>

            

              <select
  value={selectedSavedPieceId}
  onChange={(event) => {
    handleSelectSavedPiece(
      event.target.value
    );
  }}
  style={{
    width: "100%",
    height: "36px",
    marginTop: "6px",
    padding: "0 8px",
    border:
      "1px solid #aeb6bf",
    borderRadius: "5px",
    background: "#ffffff",
    cursor: "pointer"
  }}
>
  <option
  value=""
  disabled
>
  Llistat
</option>

  {[...savedPieces]
    .sort((pieceA, pieceB) =>
      pieceA.name.localeCompare(
        pieceB.name,
        "ca",
        {
          sensitivity: "base"
        }
      )
    )
    .map((savedPiece) => (
      <option
        key={savedPiece.id}
        value={savedPiece.id}
      >
        {savedPiece.name}
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
    onClick={
      handleDeleteTemplate
    }
    disabled={
      !selectedSavedPieceId
    }
    style={{
      flex: 1,
      padding: "8px 10px",
      border:
        "1px solid #b02a37",
      borderRadius: "5px",
      background:
        selectedSavedPieceId
          ? "#ffffff"
          : "#eceff2",
      color:
        selectedSavedPieceId
          ? "#b02a37"
          : "#7b848d",
      cursor:
        selectedSavedPieceId
          ? "pointer"
          : "not-allowed"
    }}
  >
    Eliminar plantilla
  </button>

  <button
    type="button"
    onClick={() => {
      /*
        Funcionalitat pendent.

        Més endavant aquest botó obrirà
        el selector de fitxers 3D.
      */
    }}
    style={{
      flex: 1,
      padding: "8px 10px",
     border:
        "1px solid #2*67c5",
      borderRadius: "5px",
     background: "#ffffff",
      color: "#2767c5",
      cursor: "pointer"
    }}
  >
    Importar 3D
 </button>
</div>
            </section>

            <section
              style={{
                padding: "12px",
                border:
                  "1px solid #d7dce1",
                borderRadius: "7px"
              }}
            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                Característiques
              </h3>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  fontWeight: 600,
                  marginBottom: "12px"
                }}
              >
                Nom de la peça

                <input
                  type="text"
                  value={form.name}
                  placeholder="Exemple: Caixa 200x100"
                  onChange={(event) => {
                    updateFormField(
                      "name",
                      event.target.value
                    );
                  }}
                  style={{
                    height: "36px",
                    padding: "0 9px",
                    border:
                      "1px solid #aeb6bf",
                    borderRadius: "5px"
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  fontWeight: 600,
                  marginBottom: "12px"
                }}
              >
                Tipus de peça

                <select
                  value={
                    form.pieceType
                  }
                  onChange={(event) => {
                    updateFormField(
                      "pieceType",
                      event.target.value
                    );
                  }}
                  style={{
                    height: "36px",
                    border:
                      "1px solid #aeb6bf",
                    borderRadius: "5px"
                  }}
                >
                  <option
                    value="RECTANGULAR"
                  >
                    RECTANGULAR
                  </option>

                  <option
                    value="TRAPEZOIDAL"
                  >
                    TRAPEZOIDAL
                  </option>
                </select>
              </label>

              <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "7px"
  }}
>
                <NumericField
                  label="Width"
                  value={form.width}
                  onChange={(value) => {
                    updateNumericField(
                      "width",
                      value
                    );
                  }}
                />

                <NumericField
                  label="Height"
                  value={form.height}
                  onChange={(value) => {
                    updateNumericField(
                      "height",
                      value
                    );
                  }}
                />

                <NumericField
                  label="Depth"
                  value={form.depth}
                  onChange={(value) => {
                    updateNumericField(
                      "depth",
                      value
                    );
                  }}
                />

                {form.pieceType ===
                  "TRAPEZOIDAL" && (
                  <>
                    <NumericField
                      label="Top Width"
                      value={
                        form.topWidth
                      }
                      onChange={(
                        value
                      ) => {
                        updateNumericField(
                          "topWidth",
                          value
                        );
                      }}
                    />

                    <NumericField
                      label="Top Depth"
                      value={
                        form.topDepth
                      }
                      onChange={(
                        value
                      ) => {
                        updateNumericField(
                          "topDepth",
                          value
                        );
                      }}
                    />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={
                  handleSaveTemplate
                }
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding:
                    "10px 14px",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "#2767c5",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Guardar nom i característiques
              </button>

              {feedbackMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "9px",
                    borderRadius: "5px",
                    background:
                      "#eef4fb",
                    color: "#244d7c"
                  }}
                >
                  {feedbackMessage}
                </div>
              )}
            </section>
          </div>

          <div>
            <h3
              style={{
                marginTop: 0
              }}
            >
              Previsualització 3D
            </h3>

            <PiecePreview
              pieceType={
                form.pieceType
              }
              width={previewWidth}
              height={previewHeight}
              depth={previewDepth}
              topWidth={
                previewTopWidth
              }
              topDepth={
                previewTopDepth
              }
            />

            <div
              style={{
                marginTop: "10px",
                color: "#59636e",
                fontSize: "14px"
              }}
            >
              Arrossega amb el ratolí per
              rotar la vista. Utilitza la
              roda per apropar o allunyar.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: "8px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop:
              "1px solid #d7dce1"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              border:
                "1px solid #9ea7b0",
              borderRadius: "6px",
              background: "#ffffff",
              cursor: "pointer"
            }}
          >
            Cancel·lar
          </button>

          <button
            type="button"
            onClick={
              handleCreatePiece
            }
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
            Crear peça
          </button>
        </div>
      </div>
    </div>
  );
}
``
