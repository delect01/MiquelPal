import { roundToThreeDecimals } from "./appModelUtils.js";

export function moveSelectionWithKeyboard({
  event,
  selectedPieceIds,
  setPieces
}) {
  if (
    selectedPieceIds.length === 0
  ) {
    return false;
  }

  const isArrowKey =
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight"
    ].includes(event.key);

  if (!isArrowKey) {
    return false;
  }

  event.preventDefault();

  const step =
    event.shiftKey
      ? 1
      : 10;

  let deltaX = 0;
  let deltaY = 0;

  switch (event.key) {
    case "ArrowUp":
      deltaX = step;
      break;

    case "ArrowDown":
      deltaX = -step;
      break;

    case "ArrowLeft":
      deltaY = step;
      break;

    case "ArrowRight":
      deltaY = -step;
      break;

    default:
      return false;
  }

  const selectedSet =
    new Set(
      selectedPieceIds
    );

  setPieces(
    currentPieces =>
      currentPieces.map(
        piece => {
          if (
            !selectedSet.has(
              piece.id
            )
          ) {
            return piece;
          }

          return {
            ...piece,

            x:
              roundToThreeDecimals(
                piece.x +
                deltaX
              ),

            y:
              roundToThreeDecimals(
                piece.y +
                deltaY
              )
          };
        }
      )
  );

  return true;
}