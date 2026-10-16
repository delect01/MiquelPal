import * as THREE from "three";

const IMPORTED_FACE_PREFIX =
  "IMPORTED_FACE_";

const FACE_NAMES = [
  {
    key: "TOP_CENTER",
    label: "TOP_CENTER",
    axis: new THREE.Vector3(0, 0, 1)
  },
  {
    key: "BOTTOM_CENTER",
    label: "BOTTOM_CENTER",
    axis: new THREE.Vector3(0, 0, -1)
  },
  {
    key: "FRONT_CENTER",
    label: "BACK_CENTER",
    axis: new THREE.Vector3(1, 0, 0)
  },
  {
    key: "BACK_CENTER",
    label: "FRONT_CENTER",
    axis: new THREE.Vector3(-1, 0, 0)
  },
  {
    key: "LEFT_CENTER",
    label: "LEFT_CENTER",
    axis: new THREE.Vector3(0, 1, 0)
  },
  {
    key: "RIGHT_CENTER",
    label: "RIGHT_CENTER",
    axis: new THREE.Vector3(0, -1, 0)
  }
];

export function isImportedFaceReference(
  referencePoint
) {
  return (
    typeof referencePoint === "string" &&
    referencePoint.startsWith(
      IMPORTED_FACE_PREFIX
    )
  );
}

export function getImportedFace(
  piece,
  referencePoint =
    piece?.referencePoint
) {
  if (
    piece?.pieceType !==
      "IMPORTED_3D" ||
    !isImportedFaceReference(
      referencePoint
    ) ||
    !Array.isArray(
      piece.collisionGeometry?.faces
    )
  ) {
    return null;
  }

  return (
    piece.collisionGeometry.faces.find(
      (face) =>
        face.id === referencePoint
    ) ?? null
  );
}

export function importedThreeVectorToPallet(
  vector
) {
  return new THREE.Vector3(
    -Number(vector?.z ?? 0),
    -Number(vector?.x ?? 0),
    Number(vector?.y ?? 0)
  );
}

export function getImportedFaceCenterPallet(
  piece,
  referencePoint =
    piece?.referencePoint
) {
  const face = getImportedFace(
    piece,
    referencePoint
  );

  return face?.center
    ? importedThreeVectorToPallet(
        face.center
      )
    : null;
}

export function getImportedFaceNormalPallet(
  piece,
  referencePoint =
    piece?.referencePoint
) {
  const face = getImportedFace(
    piece,
    referencePoint
  );

  if (!face?.normal) {
    return null;
  }

  const normal =
    importedThreeVectorToPallet(
      face.normal
    );

  return normal.lengthSq() > 0
    ? normal.normalize()
    : null;
}

function getFaceName(
  piece,
  face
) {
  const normal =
    getImportedFaceNormalPallet(
      piece,
      face.id
    );

  if (!normal) {
    return face.label;
  }

  let bestMatch = FACE_NAMES[0];
  let bestDot = -Infinity;

  FACE_NAMES.forEach((candidate) => {
    const dot =
      normal.dot(candidate.axis);

    if (dot > bestDot) {
      bestDot = dot;
      bestMatch = candidate;
    }
  });

  return bestMatch.label;
}

export function getImportedReferenceOptions(
  piece
) {
  if (
    piece?.pieceType !==
      "IMPORTED_3D" ||
    !Array.isArray(
      piece.collisionGeometry?.faces
    )
  ) {
    return [];
  }

  const namedFaces =
    piece.collisionGeometry.faces.map(
      (face) => ({
        value: face.id,
        label: getFaceName(
          piece,
          face
        )
      })
    );

  const order = new Map(
    [
      "TOP_CENTER",
      "BOTTOM_CENTER",
      "FRONT_CENTER",
      "BACK_CENTER",
      "LEFT_CENTER",
      "RIGHT_CENTER"
    ].map((name, index) => [
      name,
      index
    ])
  );

  namedFaces.sort(
    (faceA, faceB) =>
      (order.get(faceA.label) ?? 99) -
      (order.get(faceB.label) ?? 99)
  );

  return [
    {
      value: "CENTER",
      label: "CENTER"
    },
    ...namedFaces
  ];
}
