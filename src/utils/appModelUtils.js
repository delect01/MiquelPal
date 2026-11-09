import {
  getImportedReferenceOptions
} from "./importedFaceUtils.js";
import {
  cleanupGraspGroups,
  getOperationKey
} from "./graspGroups.js";

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

/*
  Repara els ID en carregar (projectes, autodesat i
  capes): cada operació ha de tenir un ID enter, positiu
  i propi. Un ID repetit només es manté dins d'una
  mateixa agafada múltiple; fora d'això, la peça rep el
  següent ID lliure (com sempre).
*/
export function ensureOrderIds(
  sourcePieces
) {
  if (!Array.isArray(sourcePieces)) {
    return [];
  }

  const pieces = cleanupGraspGroups(sourcePieces);

  // ID ja ocupats i operació que el fa servir
  const operationKeyByOrderId = new Map();
  // ID assignat a cada operació
  const orderIdByOperationKey = new Map();
  let nextOrderId = 1;

  return pieces.map((piece) => {
    const operationKey = getOperationKey(piece);
    const numericOrderId =
      Number(piece.orderId);

    const isValidNumber =
      Number.isInteger(numericOrderId) &&
      numericOrderId > 0;

    const owner =
      operationKeyByOrderId.get(numericOrderId);

    const canKeep =
      isValidNumber &&
      (owner === undefined || owner === operationKey) &&
      (!orderIdByOperationKey.has(operationKey) ||
        orderIdByOperationKey.get(operationKey) === numericOrderId);

    if (canKeep) {
      operationKeyByOrderId.set(numericOrderId, operationKey);
      orderIdByOperationKey.set(operationKey, numericOrderId);

      nextOrderId = Math.max(
        nextOrderId,
        numericOrderId + 1
      );

      return {
        ...piece,
        orderId: numericOrderId
      };
    }

    // La resta de peces de la mateixa agafada ja en tenen
    if (orderIdByOperationKey.has(operationKey)) {
      return {
        ...piece,
        orderId: orderIdByOperationKey.get(operationKey)
      };
    }

    while (
      operationKeyByOrderId.has(
        nextOrderId
      )
    ) {
      nextOrderId += 1;
    }

    const assignedOrderId =
      nextOrderId;

    operationKeyByOrderId.set(assignedOrderId, operationKey);
    orderIdByOperationKey.set(operationKey, assignedOrderId);

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

/*
  Offsets genèrics d'aproximació i retirada de la pinça
  d'una capa (x, y, z en mm).
*/
export function createEmptyGripperOffsets() {
  return {
    approach: { x: 0, y: 0, z: 0 },
    retreat: { x: 0, y: 0, z: 0 }
  };
}

// Còpia neta: valors numèrics i, si falten, zeros
export function normalizeGripperOffsets(offsets) {
  const toNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const normalizeVector = (vector) => ({
    x: toNumber(vector?.x),
    y: toNumber(vector?.y),
    z: toNumber(vector?.z)
  });

  return {
    approach: normalizeVector(offsets?.approach),
    retreat: normalizeVector(offsets?.retreat)
  };
}

export function areGripperOffsetsEqual(offsetsA, offsetsB) {
  return (
    JSON.stringify(normalizeGripperOffsets(offsetsA)) ===
    JSON.stringify(normalizeGripperOffsets(offsetsB))
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
