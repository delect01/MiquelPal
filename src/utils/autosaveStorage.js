export const AUTOSAVE_STORAGE_KEY =
  "pallet-simulator-composition";

export function loadAutosave() {
  try {
    const savedValue =
      window.localStorage.getItem(
        AUTOSAVE_STORAGE_KEY
      );

    if (!savedValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(savedValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object"
    ) {
      return null;
    }

    return {
      pieces:
        Array.isArray(parsedValue.pieces)
          ? parsedValue.pieces
          : [],

      activePallet:
        parsedValue.activePallet &&
        typeof parsedValue.activePallet ===
          "object"
          ? parsedValue.activePallet
          : null,

      activeGripper:
        parsedValue.activeGripper &&
        typeof parsedValue.activeGripper ===
          "object"
          ? parsedValue.activeGripper
          : null,

      layers:
        Array.isArray(parsedValue.layers)
          ? parsedValue.layers
          : [],

      activeLayerId:
        parsedValue.activeLayerId ?? null,

      palletizingSequence:
        Array.isArray(
          parsedValue.palletizingSequence
        )
          ? parsedValue.palletizingSequence
          : [],

      selectedPieceId:
        parsedValue.selectedPieceId ?? null,

      activeProject:
        parsedValue.activeProject &&
        typeof parsedValue.activeProject ===
          "object"
          ? parsedValue.activeProject
          : null,

      savedAt:
        parsedValue.savedAt ?? null
    };
  } catch (error) {
    console.error(
      "No s'ha pogut carregar la còpia de recuperació:",
      error
    );

    return null;
  }
}

export function saveAutosave({
  pieces,
  activePallet,
  activeGripper,
  layers,
  activeLayerId,
  palletizingSequence,
  selectedPieceId,
  activeProject
}) {
  try {
    const autosaveData = {
      version: 1,
      savedAt: new Date().toISOString(),
      pieces,
      activePallet,
      activeGripper,
      layers,
      activeLayerId,
      palletizingSequence,
      selectedPieceId,
      activeProject
    };

    window.localStorage.setItem(
      AUTOSAVE_STORAGE_KEY,
      JSON.stringify(autosaveData)
    );

    return true;
  } catch (error) {
    console.error(
      "No s'ha pogut guardar la còpia de recuperació:",
      error
    );

    return false;
  }
}

export function clearAutosave() {
  window.localStorage.removeItem(
    AUTOSAVE_STORAGE_KEY
  );
}
