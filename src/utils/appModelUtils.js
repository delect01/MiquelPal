import {
  getImportedReferenceOptions
} from "./importedFaceUtils.js";

export const REFERENCE_POINT_OPTIONS = [
  {
    value: "CENTER",
    label: "CENTER"
  },
  {
    value: "TOP_CENTER",
    label: "TOP_CENTER"
  },
  {
    value: "BOTTOM_CENTER",
    label: "BOTTOM_CENTER"
  },
  {
    value: "BACK_CENTER",
    label: "FRONT_CENTER"
  },
  {
    value: "FRONT_CENTER",
    label: "BACK_CENTER"
  },
  {
    value: "LEFT_CENTER",
    label: "LEFT_CENTER"
  },
  {
    value: "RIGHT_CENTER",
    label: "RIGHT_CENTER"
  }
];

export function getReferencePointOptions(
  piece
) {
  if (
    piece?.pieceType ===
    "IMPORTED_3D"
  ) {
    const importedOptions =
      getImportedReferenceOptions(
        piece
      );

    if (
      importedOptions.length > 1
    ) {
      return importedOptions;
    }
  }

  return REFERENCE_POINT_OPTIONS;
}

export function getReferencePointLabel(
  referencePoint,
  piece = null
) {
  const option =
    getReferencePointOptions(piece)
      .find(
        (item) =>
          item.value ===
          referencePoint
      );

  return (
    option?.label ??
    referencePoint
  );
}

export function ensureOrderIds(
  sourcePieces
) {
  if (!Array.isArray(sourcePieces)) {
    return [];
  }

  const usedOrderIds = new Set();
  let nextOrderId = 1;

  return sourcePieces.map((piece) => {
    const numericOrderId =
      Number(piece.orderId);

    if (
      Number.isInteger(
        numericOrderId
      ) &&
      numericOrderId > 0 &&
      !usedOrderIds.has(
        numericOrderId
      )
    ) {
      usedOrderIds.add(
        numericOrderId
      );

      nextOrderId = Math.max(
        nextOrderId,
        numericOrderId + 1
      );

      return {
        ...piece,
        orderId: numericOrderId
      };
    }

    while (
      usedOrderIds.has(
        nextOrderId
      )
    ) {
      nextOrderId += 1;
    }

    const assignedOrderId =
      nextOrderId;

    usedOrderIds.add(
      assignedOrderId
    );

    nextOrderId += 1;

    return {
      ...piece,
      orderId:
        assignedOrderId
    };
  });
}

export function cloneLayerPieces(
  sourcePieces
) {
  return Array.isArray(sourcePieces)
    ? sourcePieces.map((piece) => ({
        ...piece
      }))
    : [];
}

export function getLayerPiecesSignature(
  sourcePieces
) {
  return JSON.stringify(
    cloneLayerPieces(sourcePieces)
  );
}

export function createRuntimeId(
  prefix
) {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return window.crypto.randomUUID();
  }

  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(16)
      .slice(2)
  ].join("-");
}

export function createLayerId() {
  return createRuntimeId("layer");
}

export function createPalletizingInstanceId() {
  return createRuntimeId(
    "palletized-layer"
  );
}

export function roundToThreeDecimals(
  value
) {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) * 1000
    ) / 1000
  );
}
