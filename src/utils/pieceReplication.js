import * as THREE from "three";
import { getPieceLocalVertices } from "./pieceGeometry";
import { palletEulerToThreeQuaternion, threeToPallet } from "./pieceUtils";

const REPLICATION_CLEARANCE = 0.5;

function getProjectedStep(piece) {
  const quaternion =
    palletEulerToThreeQuaternion(
      Number(piece.rxDeg) || 0,
      Number(piece.ryDeg) || 0,
      Number(piece.rzDeg) || 0
    );

  const vertices =
    getPieceLocalVertices(piece);

  let minimumX = Infinity;
  let maximumX = -Infinity;
  let minimumZ = Infinity;
  let maximumZ = -Infinity;

  vertices.forEach((vertex) => {
    const rotated = vertex
      .clone()
      .applyQuaternion(
        quaternion
      );

    minimumX = Math.min(
      minimumX,
      rotated.x
    );

    maximumX = Math.max(
      maximumX,
      rotated.x
    );

    minimumZ = Math.min(
      minimumZ,
      rotated.z
    );

    maximumZ = Math.max(
      maximumZ,
      rotated.z
    );
  });

  const projectedSizeX =
    Math.max(
      maximumX - minimumX,
      0.001
    );

  const projectedSizeZ =
    Math.max(
      maximumZ - minimumZ,
      0.001
    );

  return {
    stepX:
      projectedSizeX +
      REPLICATION_CLEARANCE,

    stepZ:
      projectedSizeZ +
      REPLICATION_CLEARANCE
  };
}

export function buildReplicationCandidates({
  sourcePiece,
  startThreeX,
  startThreeZ,
  currentThreeX,
  currentThreeZ
}) {
  if (!sourcePiece) {
    return [];
  }

  const { stepX, stepZ } =
    getProjectedStep(sourcePiece);

  const deltaX = currentThreeX - startThreeX;
  const deltaZ = currentThreeZ - startThreeZ;

  const columnCount = Math.max(
    0,
    Math.round(Math.abs(deltaX) / stepX)
  );

  const rowCount = Math.max(
    0,
    Math.round(Math.abs(deltaZ) / stepZ)
  );

  const directionX = deltaX < 0 ? -1 : 1;
  const directionZ = deltaZ < 0 ? -1 : 1;

  const candidates = [];

  for (
    let columnIndex = 0;
    columnIndex <= columnCount;
    columnIndex += 1
  ) {
    for (
      let rowIndex = 0;
      rowIndex <= rowCount;
      rowIndex += 1
    ) {
      if (columnIndex === 0 && rowIndex === 0) {
        continue;
      }

      const threeX =
        startThreeX +
        columnIndex * stepX * directionX;

      const threeZ =
        startThreeZ +
        rowIndex * stepZ * directionZ;

      const palletPosition = threeToPallet(
        threeX,
        0,
        threeZ
      );

      candidates.push({
        previewId:
          `${columnIndex}-${rowIndex}`,
        columnIndex,
        rowIndex,
        piece: {
          ...sourcePiece,
          x: palletPosition.x,
          y: palletPosition.y
        }
      });
    }
  }

  return candidates;
}
