import {
  useEffect,
  useMemo
} from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "../utils/pieceUtils";
import {
  getPieceLocalVertices
} from "../utils/pieceGeometry";
import ImportedPieceModel from "./ImportedPieceModel.jsx";

function createTrapezoidGeometry(piece) {
  const vertices =
    getPieceLocalVertices(piece)
      .flatMap((vertex) => [
        vertex.x,
        vertex.y,
        vertex.z
      ]);

  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0
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

export default function ProjectPreviewPiece({
  piece
}) {
  const center =
    getPieceCenter(piece);

  const quaternion =
    palletEulerToThreeQuaternion(
      piece.rxDeg,
      piece.ryDeg,
      piece.rzDeg
    );

  const isImported =
    piece.pieceType ===
      "IMPORTED_3D" &&
    Boolean(piece.modelId);

  const trapezoidGeometry =
    useMemo(() => {
      if (
        piece.pieceType !==
        "TRAPEZOIDAL"
      ) {
        return null;
      }

      return createTrapezoidGeometry(
        piece
      );
    }, [
      piece.pieceType,
      piece.width,
      piece.height,
      piece.depth,
      piece.topWidth,
      piece.topDepth
    ]);

  useEffect(() => {
    return () => {
      trapezoidGeometry?.dispose();
    };
  }, [trapezoidGeometry]);

  const color =
    piece.color ||
    (
      piece.pieceCategory ===
      "SEPARATOR"
        ? "#d4b483"
        : "#f28c28"
    );

  return (
    <group
      position={[
        center.x,
        center.y,
        center.z
      ]}
      quaternion={[
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      ]}
    >
      {isImported ? (
        <ImportedPieceModel
          modelId={piece.modelId}
          bottomFace={
            piece.modelBottomFace ??
            "NEGATIVE_Y"
          }
          visualState="normal"
          dimmed={false}
        />
      ) : (
        <mesh
          castShadow
          receiveShadow
          raycast={() => null}
        >
          {piece.pieceType ===
          "TRAPEZOIDAL" ? (
            <primitive
              object={trapezoidGeometry}
              attach="geometry"
            />
          ) : (
            <boxGeometry
              args={[
                Number(piece.width) || 1,
                Number(piece.height) || 1,
                Number(piece.depth) || 1
              ]}
            />
          )}

          <meshStandardMaterial
            color={color}
            roughness={0.68}
            metalness={0}
          />

          <Edges
            threshold={15}
            color="#3f4750"
          />
        </mesh>
      )}
    </group>
  );
}
