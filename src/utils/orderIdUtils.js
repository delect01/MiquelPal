import {
  getOperationKey,
  getOperations
} from "./graspGroups.js";

export function getNextOrderId(pieces) {
  const validIds = pieces
    .map((piece) => Number(piece.orderId))
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value > 0
    );

  return validIds.length === 0
    ? 1
    : Math.max(...validIds) + 1;
}

/*
  Renumera les operacions de l'1 a N mantenint l'ordre
  actual. Les peces d'una agafada múltiple són una sola
  operació i reben totes el mateix número.
*/
export function normalizeOrderIdsAfterDeletion(
  pieces
) {
  const operations = getOperations(pieces).map(
    (operation, index) => ({
      ...operation,
      orderId: getOperationOrderId(operation),
      index
    })
  );

  operations.sort((first, second) => {
    const firstIsValid = first.orderId !== null;
    const secondIsValid = second.orderId !== null;

    if (firstIsValid && secondIsValid) {
      return first.orderId - second.orderId;
    }

    if (firstIsValid) {
      return -1;
    }

    if (secondIsValid) {
      return 1;
    }

    return (
      Number(first.lead.id) - Number(second.lead.id) ||
      first.index - second.index
    );
  });

  const orderIdByKey = new Map(
    operations.map((operation, index) => [
      operation.key,
      index + 1
    ])
  );

  return pieces.map(
    (piece) => ({
      ...piece,

      orderId:
        orderIdByKey.get(
          getOperationKey(piece)
        )
    })
  );
}

/*
  Número d'una operació: el de la peça guia o, si no en
  té, el primer vàlid del grup. null si no en té cap.
*/
export function getOperationOrderId(operation) {
  const source = [operation.lead, ...operation.pieces].find(
    hasValidOrderId
  );

  return source ? Number(source.orderId) : null;
}

/*
  Inverteix l'ordre de les operacions (útil per
  despaletitzar): la primera passa a ser l'última i a
  l'inrevés, amb els mateixos números. Una agafada
  múltiple es mou sencera.
*/
export function reverseOperationOrderIds(pieces) {
  const ordered = getOperations(pieces)
    .map((operation) => ({
      key: operation.key,
      orderId: getOperationOrderId(operation)
    }))
    .filter((operation) => operation.orderId !== null)
    .sort((first, second) => first.orderId - second.orderId);

  const reversedByKey = new Map(
    ordered.map((operation, index) => [
      operation.key,
      ordered[ordered.length - 1 - index].orderId
    ])
  );

  return pieces.map((piece) => {
    const key = getOperationKey(piece);

    return reversedByKey.has(key) && hasValidOrderId(piece)
      ? { ...piece, orderId: reversedByKey.get(key) }
      : piece;
  });
}

export function getOrderIdValidation(pieces) {
  const issuesByPieceId = new Map();
  const piecesByOrderId = new Map();

  pieces.forEach((piece) => {
    const rawValue = piece.orderId;
    const textValue = String(
      rawValue ?? ""
    ).trim();

    if (textValue === "") {
      issuesByPieceId.set(
        piece.id,
        "EMPTY"
      );
      return;
    }

    const numericValue =
      Number(textValue);

    if (
      !Number.isInteger(numericValue) ||
      numericValue <= 0
    ) {
      issuesByPieceId.set(
        piece.id,
        "INVALID"
      );
      return;
    }

    const currentList =
      piecesByOrderId.get(
        numericValue
      ) ?? [];

    currentList.push(piece);

    piecesByOrderId.set(
      numericValue,
      currentList
    );
  });

  /*
    Un ID repetit només és correcte dins d'una mateixa
    agafada múltiple (una sola operació del robot).
  */
  piecesByOrderId.forEach(
    (piecesWithId) => {
      const operationKeys = new Set(
        piecesWithId.map(getOperationKey)
      );

      if (operationKeys.size <= 1) {
        return;
      }

      piecesWithId.forEach((piece) => {
        issuesByPieceId.set(
          piece.id,
          "DUPLICATE"
        );
      });
    }
  );

  // Totes les peces d'una agafada han de tenir el mateix ID
  const operations = getOperations(pieces);

  operations.forEach((operation) => {
    if (operation.groupId === null) {
      return;
    }

    const groupOrderIds = new Set(
      operation.pieces
        .filter(hasValidOrderId)
        .map((piece) => Number(piece.orderId))
    );

    if (groupOrderIds.size <= 1) {
      return;
    }

    operation.pieces.forEach((piece) => {
      if (!issuesByPieceId.has(piece.id)) {
        issuesByPieceId.set(piece.id, "GROUP_MISMATCH");
      }
    });
  });

  const validOrderIds = pieces
    .map((piece) => Number(piece.orderId))
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value > 0
    );

  const uniqueOrderIds = Array.from(
    new Set(validOrderIds)
  ).sort((a, b) => a - b);

  const expectedIds = Array.from(
    {
      length: operations.length
    },
    (_, index) => index + 1
  );

  const isConsecutive =
    uniqueOrderIds.length ===
      expectedIds.length &&
    uniqueOrderIds.every(
      (value, index) =>
        value === expectedIds[index]
    );

  if (
    issuesByPieceId.size === 0 &&
    !isConsecutive
  ) {
    pieces.forEach((piece) => {
      issuesByPieceId.set(
        piece.id,
        "NON_CONSECUTIVE"
      );
    });
  }

  const counts = {
    empty: 0,
    invalid: 0,
    duplicate: 0,
    groupMismatch: 0,
    nonConsecutive:
      issuesByPieceId.size > 0 &&
      Array.from(
        issuesByPieceId.values()
      ).includes(
        "NON_CONSECUTIVE"
      )
  };

  issuesByPieceId.forEach((issue) => {
    if (issue === "EMPTY") {
      counts.empty += 1;
    }

    if (issue === "INVALID") {
      counts.invalid += 1;
    }

    if (issue === "DUPLICATE") {
      counts.duplicate += 1;
    }

    if (issue === "GROUP_MISMATCH") {
      counts.groupMismatch += 1;
    }
  });

  return {
    isValid:
      issuesByPieceId.size === 0,
    issuesByPieceId,
    counts,
    expectedMaximum:
      operations.length
  };
}

export function createOrderIdErrorMessage(
  validation
) {
  const messages = [];

  if (validation.counts.empty > 0) {
    messages.push(
      `${validation.counts.empty} element(s) sense ID.`
    );
  }

  if (validation.counts.invalid > 0) {
    messages.push(
      `${validation.counts.invalid} element(s) amb un ID que no és un enter positiu.`
    );
  }

  if (validation.counts.duplicate > 0) {
    messages.push(
      `${validation.counts.duplicate} element(s) comparteixen un ID duplicat.`
    );
  }

  if (validation.counts.groupMismatch > 0) {
    messages.push(
      `${validation.counts.groupMismatch} element(s) d'una agafada múltiple amb ID diferents.`
    );
  }

  if (validation.counts.nonConsecutive) {
    messages.push(
      `Els ID han de ser consecutius de l'1 al ${validation.expectedMaximum}.`
    );
  }

  return [
    "No es pot guardar la capa.",
    "",
    ...messages,
    "",
    "Corregeix els ID i torna-ho a provar."
  ].join("\n");
}

/*
  Peces en ordre de col·locació (orderId de menor a
  major). Els orderId no vàlids (buits o a mig
  escriure) van al final, en el seu ordre actual.
*/
export function sortPiecesByOrderId(pieces) {
  function getSortKey(piece) {
    return hasValidOrderId(piece)
      ? Number(piece.orderId)
      : Infinity;
  }

  return [...pieces].sort(
    (firstPiece, secondPiece) =>
      getSortKey(firstPiece) - getSortKey(secondPiece) || 0
  );
}

// orderId enter i positiu (un camp buit no compta)
export function hasValidOrderId(piece) {
  const orderId = Number(piece.orderId);

  return (
    piece.orderId !== null &&
    piece.orderId !== "" &&
    Number.isInteger(orderId) &&
    orderId > 0
  );
}
