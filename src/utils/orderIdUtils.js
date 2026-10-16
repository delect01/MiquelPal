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

export function normalizeOrderIdsAfterDeletion(
  pieces
) {
  const sortedPieces = [
    ...pieces
  ].sort(
    (
      firstPiece,
      secondPiece
    ) => {
      const firstOrderId =
        Number(
          firstPiece.orderId
        );

      const secondOrderId =
        Number(
          secondPiece.orderId
        );

      const firstIsValid =
        Number.isInteger(
          firstOrderId
        ) &&
        firstOrderId > 0;

      const secondIsValid =
        Number.isInteger(
          secondOrderId
        ) &&
        secondOrderId > 0;

      if (
        firstIsValid &&
        secondIsValid
      ) {
        return (
          firstOrderId -
          secondOrderId
        );
      }

      if (firstIsValid) {
        return -1;
      }

      if (secondIsValid) {
        return 1;
      }

      return (
        Number(firstPiece.id) -
        Number(secondPiece.id)
      );
    }
  );

  const orderIdByPieceId =
    new Map(
      sortedPieces.map(
        (piece, index) => [
          piece.id,
          index + 1
        ]
      )
    );

  return pieces.map(
    (piece) => ({
      ...piece,

      orderId:
        orderIdByPieceId.get(
          piece.id
        )
    })
  );
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

    currentList.push(piece.id);

    piecesByOrderId.set(
      numericValue,
      currentList
    );
  });

  piecesByOrderId.forEach(
    (pieceIds) => {
      if (pieceIds.length <= 1) {
        return;
      }

      pieceIds.forEach((pieceId) => {
        issuesByPieceId.set(
          pieceId,
          "DUPLICATE"
        );
      });
    }
  );

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
      length: pieces.length
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
  });

  return {
    isValid:
      issuesByPieceId.size === 0,
    issuesByPieceId,
    counts,
    expectedMaximum:
      pieces.length
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
