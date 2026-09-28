import {
  useEffect,
  useMemo
} from "react";

import {
  Canvas
} from "@react-three/fiber";

import {
  Bounds,
  Center,
  Edges,
  OrbitControls
} from "@react-three/drei";

import * as THREE from "three";

import {
  getPieceLocalVertices
} from "../utils/pieceGeometry";

const TRAPEZOID_INDICES = [
  // Base inferior
  0, 1, 2,
  0, 2, 3,

  // Part superior
  4, 6, 5,
  4, 7, 6,

  // Cara lateral 1
  0, 4, 5,
  0, 5, 1,

  // Cara lateral 2
  1, 5, 6,
  1, 6, 2,

  // Cara lateral 3
  2, 6, 7,
  2, 7, 3,

  // Cara lateral 4
  3, 7, 4,
  3, 4, 0
];

function TrapezoidGeometry({
  width,
  height,
  depth,
  topWidth,
  topDepth
}) {
  const geometry = useMemo(() => {
    const previewPiece = {
      pieceType: "TRAPEZOIDAL",

      width,
      height,
      depth,

      topWidth,
      topDepth
    };

    const localVertices =
      getPieceLocalVertices(
        previewPiece
      );

    const positions =
      localVertices.flatMap(
        (vertex) => [
          vertex.x,
          vertex.y,
          vertex.z
        ]
      );

    const newGeometry =
      new THREE.BufferGeometry();

    newGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        positions,
        3
      )
    );

    newGeometry.setIndex(
      TRAPEZOID_INDICES
    );

    newGeometry.computeVertexNormals();
    newGeometry.computeBoundingBox();
    newGeometry.computeBoundingSphere();

    return newGeometry;
  }, [
    width,
    height,
    depth,
    topWidth,
    topDepth
  ]);

  /*
    Quan les dimensions canvien es crea
    una geometria nova.

    Aquesta neteja elimina la geometria
    anterior de la memòria de Three.js.
  */
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <primitive
      object={geometry}
      attach="geometry"
    />
  );
}

function PreviewPiece({
  pieceType,
  width,
  height,
  depth,
  topWidth,
  topDepth
}) {
  return (
    <mesh
      castShadow
      receiveShadow
    >
      {pieceType ===
      "TRAPEZOIDAL" ? (
        <TrapezoidGeometry
          width={width}
          height={height}
          depth={depth}
          topWidth={topWidth}
          topDepth={topDepth}
        />
      ) : (
        <boxGeometry
          args={[
            width,
            height,
            depth
          ]}
        />
      )}

      <meshStandardMaterial
        color="#f28c28"
        roughness={0.55}
        metalness={0}
      />

      <Edges
        threshold={15}
        color="#202020"
      />
    </mesh>
  );
}

export default function PiecePreview({
  pieceType,
  width,
  height,
  depth,
  topWidth,
  topDepth
}) {
  /*
    Protecció contra valors buits,
    negatius o no numèrics mentre
    l'usuari escriu als inputs.
  */
  const safeWidth =
    Number.isFinite(Number(width)) &&
    Number(width) > 0
      ? Number(width)
      : 1;

  const safeHeight =
    Number.isFinite(Number(height)) &&
    Number(height) > 0
      ? Number(height)
      : 1;

  const safeDepth =
    Number.isFinite(Number(depth)) &&
    Number(depth) > 0
      ? Number(depth)
      : 1;

  const safeTopWidth =
    Number.isFinite(
      Number(topWidth)
    ) &&
    Number(topWidth) > 0
      ? Number(topWidth)
      : safeWidth;

  const safeTopDepth =
    Number.isFinite(
      Number(topDepth)
    ) &&
    Number(topDepth) > 0
      ? Number(topDepth)
      : safeDepth;

  const gridSize =
    Math.max(
      safeWidth,
      safeHeight,
      safeDepth,
      safeTopWidth,
      safeTopDepth,
      100
    ) * 3;

  return (
    <div
      style={{
        width: "100%",
        height: "360px",
        position: "relative",
        background: "#eef1f4",
        border:
          "1px solid #aeb6bf",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [
            500,
            350,
            500
          ],
          near: 0.1,
          far: 100000,
          fov: 45
        }}
      >
        <color
          attach="background"
          args={["#eef1f4"]}
        />

        <ambientLight
          intensity={1.1}
        />

        <directionalLight
          castShadow
          position={[
            500,
            800,
            500
          ]}
          intensity={1.5}
        />

        <directionalLight
          position={[
            -400,
            300,
            -400
          ]}
          intensity={0.6}
        />

        {/*
          Bounds enquadra automàticament
          la peça quan canvien les seves
          dimensions.
        */}
        <Bounds
          fit
          clip
          observe
          margin={1.4}
        >
          {/*
            Center garanteix que la peça
            quedi centrada dins de la
            previsualització.
          */}
          <Center>
            <PreviewPiece
              pieceType={pieceType}
              width={safeWidth}
              height={safeHeight}
              depth={safeDepth}
              topWidth={
                safeTopWidth
              }
              topDepth={
                safeTopDepth
              }
            />
          </Center>
        </Bounds>

        <gridHelper
          args={[
            gridSize,
            20,
            "#8f99a5",
            "#c3c9d0"
          ]}
          position={[
            0,
            -safeHeight / 2,
            0
          ]}
        />

        <OrbitControls
          makeDefault
          enableRotate
          enableZoom
          enablePan={false}
          minDistance={10}
          maxDistance={100000}
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: "12px",
          bottom: "10px",
          padding: "5px 8px",
          borderRadius: "4px",
          background:
            "rgba(255, 255, 255, 0.82)",
          color: "#404850",
          fontSize: "12px",
          pointerEvents: "none"
        }}
      >
        Arrossega per rotar · Roda per ampliar
      </div>
    </div>
  );
}