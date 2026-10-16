//pallet dialog

import {
  useEffect,
  useState
} from "react";

import PalletPreview from "./PalletPreview";
import Import3DButton from "./Import3DButton.jsx";
import { loadTransformedStoredModel } from "../utils/modelLoader.js";

const STORAGE_KEY =
  "pallet-simulator-pallet-library";

function createFormFromPallet(
  pallet
) {
  return {
    name:
      pallet.name ??
      "",

    sizeX:
      Number(pallet.sizeX),

    sizeY:
      Number(pallet.sizeY),

    sizeZ:
      Number(pallet.sizeZ),

    color:
      pallet.color ??
      "#8b5a2b",

    modelType:
      pallet.modelType ??
      "BOX",

    modelData:
      pallet.modelData ??
      null
  };
}

function loadSavedPallets() {
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
      "No s'ha pogut carregar la biblioteca de palets:",
      error
    );

    return [];
  }
}

function savePalletLibrary(
  pallets
) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(pallets)
    );

    return true;
  } catch (error) {
    console.error(
      "No s'ha pogut guardar la biblioteca de palets:",
      error
    );

    return false;
  }
}

function NumericField({
  label,
  value,
  onChange
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        minWidth: 0,
        color: "#404850",
        fontSize: "12px",
        fontWeight: 600
      }}
    >
      {label}

      <input
        type="number"
        min="1"
        step="1"
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        style={{
          width: "100%",
          minWidth: 0,
          height: "31px",
          boxSizing: "border-box",
          padding: "0 6px",
          border:
            "1px solid #aeb6bf",
          borderRadius: "5px",
          fontSize: "13px"
        }}
      />
    </label>
  );
}

export default function PalletDialog({
  open,
  activePallet,
  onClose,
  onApplyPallet,
  t
}) {
  const [
    form,
    setForm
  ] = useState(() =>
    createFormFromPallet(
      activePallet
    )
  );

  const [
    savedPallets,
    setSavedPallets
  ] = useState(
    loadSavedPallets
  );

  const [
    selectedSavedPalletId,
    setSelectedSavedPalletId
  ] = useState("");

  const [
    feedbackMessage,
    setFeedbackMessage
  ] = useState("");

useEffect(() => {
  if (!open) {
    return;
  }

  setForm(
    createFormFromPallet(
      activePallet
    )
  );

  setSelectedSavedPalletId("");
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

      if (field === "sizeX") {
        return {
          ...currentForm,
          sizeX: newValue
        };
      }

      if (field === "sizeY") {
        return {
          ...currentForm,
          sizeY: newValue
        };
      }

      if (field === "sizeZ") {
        return {
          ...currentForm,
          sizeZ: newValue
        };
      }

      if (field === "color") {
        return {
          ...currentForm,
          color: newValue
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

  function getValidatedPalletData() {
    const sizeX =
      Number(form.sizeX);

    const sizeY =
      Number(form.sizeY);

    const sizeZ =
      Number(form.sizeZ);

    const dimensionsAreValid =
      Number.isFinite(sizeX) &&
      Number.isFinite(sizeY) &&
      Number.isFinite(sizeZ) &&
      sizeX > 0 &&
      sizeY > 0 &&
      sizeZ > 0;

    if (!dimensionsAreValid) {
      setFeedbackMessage(
        t.palletDialog.invalidDimensions
      );

      return null;
    }

    return {
      name:
        form.name.trim(),

      sizeX,
      sizeY,
      sizeZ,

      color:
        form.color ||
        "#8b5a2b",

      modelType:
        form.modelType ??
        "BOX",

      modelData:
        form.modelData ??
        null
    };
  }

  function handleSaveTemplate() {
    const validatedData =
      getValidatedPalletData();

    if (!validatedData) {
      return;
    }

    if (!validatedData.name) {
      setFeedbackMessage(
        t.palletDialog.nameRequired
      );

      return;
    }

    const normalizedName =
      validatedData.name
        .toLowerCase();

    const existingPallet =
      savedPallets.find(
        (savedPallet) =>
          savedPallet.name
            .toLowerCase() ===
          normalizedName
      );

    let updatedLibrary;

    if (existingPallet) {
      updatedLibrary =
        savedPallets.map(
          (savedPallet) =>
            savedPallet.id ===
            existingPallet.id
              ? {
                  ...validatedData,
                  id:
                    existingPallet.id
                }
              : savedPallet
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
        ...savedPallets,
        newTemplate
      ];
    }

    const wasSaved =
      savePalletLibrary(
        updatedLibrary
      );

    if (!wasSaved) {
      setFeedbackMessage(
        t.palletDialog.saveError
      );

      return;
    }

    setSavedPallets(
      updatedLibrary
    );

    setFeedbackMessage(
      existingPallet
        ? t.palletDialog.templateUpdated
        : t.palletDialog.templateSaved
    );
  }

  function handleSelectSavedPallet(
    savedPalletId
  ) {
    setSelectedSavedPalletId(
      savedPalletId
    );

    const savedPallet =
      savedPallets.find(
        (candidate) =>
          candidate.id ===
          savedPalletId
      );

    if (!savedPallet) {
      return;
    }

    const selectedPallet = {
      ...savedPallet
    };

    setForm(
      createFormFromPallet(
        selectedPallet
      )
    );

    /*
      Només pot existir un palet actiu.

      Seleccionar una plantilla substitueix
      immediatament el palet del simulador.
    */
    onApplyPallet(
      selectedPallet
    );

    setFeedbackMessage(
      t.palletDialog.applied(selectedPallet.name)
    );
  }

  function handleDeleteTemplate() {
    if (!selectedSavedPalletId) {
      setFeedbackMessage(
        t.palletDialog.selectBeforeDelete
      );

      return;
    }

    const updatedLibrary =
      savedPallets.filter(
        (savedPallet) =>
          savedPallet.id !==
          selectedSavedPalletId
      );

    const wasSaved =
      savePalletLibrary(
        updatedLibrary
      );

    if (!wasSaved) {
      setFeedbackMessage(
        t.palletDialog.deleteError
      );

      return;
    }

    setSavedPallets(
      updatedLibrary
    );

    setSelectedSavedPalletId("");
    setFeedbackMessage(
      t.palletDialog.templateDeleted
    );
  }

  function handleApplyPallet() {
    const validatedData =
      getValidatedPalletData();

    if (!validatedData) {
      return;
    }

    onApplyPallet({
      ...validatedData,

      id:
        activePallet.id ??
        "active-pallet"
    });

    onClose();
  }

  const previewSizeX =
    Number(form.sizeX) || 1;

  const previewSizeY =
    Number(form.sizeY) || 1;

  const previewSizeZ =
    Number(form.sizeZ) || 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.palletDialog.configure}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
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
          onClose();
        }
      }}
    >
      <div
        style={{
          width:
            "min(980px, 96vw)",
          maxHeight: "94vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: "16px",
          background: "#ffffff",
          borderRadius: "10px",
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
            marginBottom: "12px"
          }}
        >
          <div>
            <h2
              style={{
                margin: 0
              }}
            >
              {t.palletDialog.configure}
            </h2>

            <div
              style={{
                marginTop: "4px",
                color: "#59636e",
                fontSize: "14px"
              }}
            >
              {t.palletDialog.subtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.palletDialog.close}
            style={{
              width: "38px",
              height: "38px",
              border:
                "1px solid #b8c0c8",
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
              "minmax(300px, 380px) minmax(400px, 1fr)",
            gap: "16px"
          }}
        >
          <div>
            <section
              style={{
                marginBottom: "10px",
                padding: "12px",
                border:
                  "1px solid #d7dce1",
                borderRadius: "7px"
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 8px 0",
                  fontSize: "16px"
                }}
              >
              {t.palletDialog.library}
            </h3>

              <select
                value={
                  selectedSavedPalletId
                }
                onChange={(event) => {
                  handleSelectSavedPallet(
                    event.target.value
                  );
                }}
                style={{
                  width: "100%",
                  height: "36px",
                  boxSizing:
                    "border-box",
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
              {t.palletDialog.list}
            </option>

                {[...savedPallets]
                  .sort((
                    palletA,
                    palletB
                  ) =>
                    palletA.name.localeCompare(
                      palletB.name,
                      "ca",
                      {
                        sensitivity:
                          "base"
                      }
                    )
                  )
                  .map(
                    (savedPallet) => (
                      <option
                        key={
                          savedPallet.id
                        }
                        value={
                          savedPallet.id
                        }
                      >
                        {
                          savedPallet.name
                        }
                      </option>
                    )
                  )}
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
                    !selectedSavedPalletId
                  }
                  style={{
                    flex: 1,
                    padding:
                      "8px 10px",
                    border:
                      "1px solid #b02a37",
                    borderRadius: "5px",
                    background:
                      selectedSavedPalletId
                        ? "#ffffff"
                        : "#eceff2",
                    color:
                      selectedSavedPalletId
                        ? "#b02a37"
                        : "#7b848d",
                    cursor:
                      selectedSavedPalletId
                        ? "pointer"
                        : "not-allowed"
                  }}
                >
              {t.palletDialog.deleteTemplate}
            </button>

                <Import3DButton t={t} onImported={async (importedModel) => {
                  const modelData = { modelId: importedModel.modelId, modelName: importedModel.modelName, modelFormat: importedModel.modelFormat, modelUnit: importedModel.modelUnit, modelBottomFace: importedModel.modelBottomFace ?? "NEGATIVE_Y", rotationX: 0, rotationY: 0, rotationZ: 0 };
                  const loaded = await loadTransformedStoredModel(modelData.modelId, modelData);
                  setForm((current) => ({ ...current, name: current.name || importedModel.name || "", sizeX: loaded.palletDimensions.sizeX, sizeY: loaded.palletDimensions.sizeY, sizeZ: loaded.palletDimensions.sizeZ, modelType: "IMPORTED_3D", modelData }));
                }} />
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
                  margin:
                    "0 0 8px 0",
                  fontSize: "16px"
                }}
              >
              {t.palletDialog.characteristics}
            </h3>

              <label
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: "4px",
                  marginBottom: "9px",
                  color: "#404850",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
              {t.palletDialog.palletName}
            <input
                  type="text"
                  value={form.name}
                  placeholder={t.palletDialog.namePlaceholder}
                  onChange={(event) => {
                    updateFormField(
                      "name",
                      event.target.value
                    );
                  }}
                  style={{
                    height: "34px",
                    boxSizing:
                      "border-box",
                    padding: "0 8px",
                    border:
                      "1px solid #aeb6bf",
                    borderRadius: "5px"
                  }}
                />
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
                  label={t.palletDialog.sizeX}
                  value={form.sizeX}
                  onChange={(value) => {
                    updateNumericField(
                      "sizeX",
                      value
                    );
                  }}
                />

                <NumericField
                  label={t.palletDialog.sizeY}
                  value={form.sizeY}
                  onChange={(value) => {
                    updateNumericField(
                      "sizeY",
                      value
                    );
                  }}
                />

                <NumericField
                  label={t.palletDialog.sizeZ}
                  value={form.sizeZ}
                  onChange={(value) => {
                    updateNumericField(
                      "sizeZ",
                      value
                    );
                  }}
                />

                {form.modelType === "IMPORTED_3D" && form.modelData && ["X", "Y", "Z"].map((axis) => {
                  const key = `rotation${axis}`;
                  return <NumericField key={key} label={`R${axis}`} value={form.modelData[key] ?? 0} onChange={async (value) => {
                    const next = { ...form.modelData, [key]: Number(value) || 0 };
                    const loaded = await loadTransformedStoredModel(next.modelId, next);
                    setForm((current) => ({ ...current, sizeX: loaded.palletDimensions.sizeX, sizeY: loaded.palletDimensions.sizeY, sizeZ: loaded.palletDimensions.sizeZ, modelData: next }));
                  }} />;
                })}
              </div>

              <label
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "90px 1fr",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                  color: "#404850",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
              {t.palletDialog.color}
            <input
                  type="color"
                  value={form.color}
                  onChange={(event) => {
                    updateFormField(
                      "color",
                      event.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    height: "34px",
                    padding: "2px",
                    border:
                      "1px solid #aeb6bf",
                    borderRadius: "5px",
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                />
              </label>

              <button
                type="button"
                onClick={
                  handleSaveTemplate
                }
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding:
                    "9px 12px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#2767c5",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
              {t.palletDialog.saveCharacteristics}
            </button>

              {feedbackMessage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    borderRadius: "5px",
                    background:
                      "#eef4fb",
                    color: "#244d7c",
                    fontSize: "13px"
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
                margin:
                  "0 0 8px 0",
                fontSize: "16px"
              }}
            >
              {t.palletDialog.preview3D}
            </h3>

            <PalletPreview
              sizeX={previewSizeX}
              sizeY={previewSizeY}
              sizeZ={previewSizeZ}
              color={form.color}
              modelType={form.modelType}
              modelData={form.modelData}
            />

            <div
              style={{
                marginTop: "8px",
                color: "#59636e",
                fontSize: "13px"
              }}
            >
              {t.palletDialog.surfaceHelp}
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
              padding:
                "10px 18px",
              border:
                "1px solid #9ea7b0",
              borderRadius: "6px",
              background: "#ffffff",
              cursor: "pointer"
            }}
          >
              {t.common.cancel}
            </button>

          <button
            type="button"
            onClick={
              handleApplyPallet
            }
            style={{
              padding:
                "10px 22px",
              border: "none",
              borderRadius: "6px",
              background: "#168447",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
              {t.palletDialog.applyPallet}
            </button>
        </div>
      </div>
    </div>
  );
}