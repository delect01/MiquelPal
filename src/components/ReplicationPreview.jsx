import { useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "../utils/pieceUtils.js";
import { getPieceLocalVertices } from "../utils/pieceGeometry.js";

function createTrapezoidGeometry(piece) {
  const localVertices = getPieceLocalVertices(piece);

  const vertices = localVertices.flatMap(
    (vertex) => [vertex.x, vertex.y, vertex.z]
  );

  const indices = [
    0, 1, 2,
    0, 2, 3,
    4, 6, 5,
    4, 7, 6,
    0, 4, 5,
    0, 5, 1,
    1, 5, 6,
    1, 6, 2,
    2, 6, 7,
    2, 7, 3,
    3, 7, 4,
    3, 4, 0
  ];

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function PreviewPiece({ piece, colliding }) {
  const center = getPieceCenter(piece);

  const quaternion = palletEulerToThreeQuaternion(
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg
  );

  const trapezoidGeometry = useMemo(
    () =>
      piece.pieceType === "TRAPEZOIDAL"
        ? createTrapezoidGeometry(piece)
        : null,
    [
      piece.pieceType,
      piece.width,
      piece.height,
      piece.depth,
      piece.topWidth,
      piece.topDepth
    ]
  );

  return (
    <mesh
      position={[center.x, center.y, center.z]}
      quaternion={[
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      ]}
      renderOrder={10}
      raycast={() => null}
    >
      {piece.pieceType === "TRAPEZOIDAL" ? (
        <primitive
          object={trapezoidGeometry}
          attach="geometry"
        />
      ) : (
        <boxGeometry
          args={[
            piece.width,
            piece.height,
            piece.depth
          ]}
        />
      )}

      <meshStandardMaterial
        color={colliding ? "#163a70" : "#ef4444"}
        transparent
        opacity={0.42}
        depthWrite={false}
        roughness={0.65}
        metalness={0}
      />

      <Edges
        threshold={15}
        color={colliding ? "#60a5fa" : "#ffffff"}
      />
    </mesh>
  );
}

export default function ReplicationPreview({ candidates }) {
  return (
    <group>
      {candidates.map((candidate) => (
        <PreviewPiece
          key={candidate.previewId}
          piece={candidate.piece}
          colliding={candidate.colliding}
        />
      ))}
    </group>
  );
}
