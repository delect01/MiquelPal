import { useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "../utils/pieceUtils";
import {
  getPieceLocalVertices
} from "../utils/pieceGeometry";

function createTrapezoidGeometry(piece) {
  const localVertices =
    getPieceLocalVertices(piece);

  const vertices = localVertices.flatMap(
    (vertex) => [
      vertex.x,
      vertex.y,
      vertex.z
    ]
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

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function PalletizedPiece({
  piece,
  selected,
  onSelectLayer
}) {
  const pieceCenter =
    getPieceCenter(piece);

  const quaternion =
    palletEulerToThreeQuaternion(
      piece.rxDeg,
      piece.ryDeg,
      piece.rzDeg
    );

  const trapezoidGeometry = useMemo(
    () =>
      piece.pieceType ===
      "TRAPEZOIDAL"
        ? createTrapezoidGeometry(
            piece
          )
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

  const baseColor =
    piece.color ||
    (
      piece.pieceCategory ===
      "SEPARATOR"
        ? "#d4b483"
        : "orange"
    );

  return (
    <mesh
      position={[
        pieceCenter.x,
        pieceCenter.y,
        pieceCenter.z
      ]}
      quaternion={[
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      ]}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectLayer();
      }}
    >
      {piece.pieceType ===
      "TRAPEZOIDAL" ? (
        <primitive
          object={
            trapezoidGeometry
          }
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
        color={
          selected
            ? "#ef4444"
            : baseColor
        }
        transparent
        opacity={
          selected
            ? 0.8
            : 0.72
        }
        roughness={0.68}
        metalness={0}
      />

      <Edges
        threshold={15}
        color={
          selected
            ? "#ffffff"
            : "#3f4750"
        }
      />
    </mesh>
  );
}

export default function PalletizedLayer({
  layerInstance,
  selected,
  onSelect
}) {
  return (
    <group>
      {layerInstance.pieces.map(
        (piece) => (
          <PalletizedPiece
            key={piece.id}
            piece={piece}
            selected={selected}
            onSelectLayer={() => {
              onSelect(
                layerInstance.instanceId
              );
            }}
          />
        )
      )}
    </group>
  );
}
