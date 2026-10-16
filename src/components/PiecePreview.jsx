import {
  useEffect,
  useMemo,
  useState
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
import {
  loadStoredModel
} from "../utils/modelLoader.js";

const TRAPEZOID_INDICES = [
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

function TrapezoidGeometry(props) {
  const geometry = useMemo(() => {
    const vertices =
      getPieceLocalVertices({
        pieceType:
          "TRAPEZOIDAL",
        ...props
      }).flatMap((vertex) => [
        vertex.x,
        vertex.y,
        vertex.z
      ]);

    const nextGeometry =
      new THREE.BufferGeometry();

    nextGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        vertices,
        3
      )
    );

    nextGeometry.setIndex(
      TRAPEZOID_INDICES
    );

    nextGeometry.computeVertexNormals();

    return nextGeometry;
  }, [
    props.width,
    props.height,
    props.depth,
    props.topWidth,
    props.topDepth
  ]);

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

function StoredPreviewModel({
  modelId,
  bottomFace,
  onDimensions
}) {
  const [object, setObject] =
    useState(null);

  useEffect(() => {
    let active = true;

    setObject(null);

    loadStoredModel(
      modelId,
      bottomFace
    )
      .then(({
        object: loadedObject,
        dimensions,
        collisionGeometry
      }) => {
        if (!active) {
          return;
        }

        setObject(
          loadedObject
        );

        onDimensions?.({
          ...dimensions,
          collisionGeometry
        });
      })
      .catch((error) => {
        console.error(
          "No s'ha pogut preparar la previsualitzacio 3D:",
          error
        );
      });

    return () => {
      active = false;
    };
  }, [
    modelId,
    bottomFace,
    onDimensions
  ]);

  return object
    ? <primitive object={object} />
    : null;
}

export default function PiecePreview({
  pieceType,
  width,
  height,
  depth,
  topWidth,
  topDepth,
  modelId,
  modelBottomFace,
  onImportedDimensions
}) {
  const safe = (
    value,
    fallback = 1
  ) =>
    Number.isFinite(
      Number(value)
    ) &&
    Number(value) > 0
      ? Number(value)
      : fallback;

  const safeWidth = safe(width);
  const safeHeight = safe(height);
  const safeDepth = safe(depth);

  const safeTopWidth = safe(
    topWidth,
    safeWidth
  );

  const safeTopDepth = safe(
    topDepth,
    safeDepth
  );

  const imported =
    pieceType ===
      "IMPORTED_3D" &&
    Boolean(modelId);

  const gridSize =
    Math.max(
      safeWidth,
      safeHeight,
      safeDepth,
      100
    ) * 3;

  /*
    Tant les peces parametriques com les
    importades tenen el pivot al centre.

    Per tant el terra de la previsualitzacio
    ha d'estar sempre a -height / 2.
  */
  const floorY =
    -safeHeight / 2;

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

        <Bounds
          fit
          clip
          observe
          margin={1.4}
        >
          {imported ? (
            <StoredPreviewModel
              modelId={modelId}
              bottomFace={
                modelBottomFace
              }
              onDimensions={
                onImportedDimensions
              }
            />
          ) : (
            <Center>
              <mesh
                castShadow
                receiveShadow
              >
                {pieceType ===
                "TRAPEZOIDAL" ? (
                  <TrapezoidGeometry
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
                ) : (
                  <boxGeometry
                    args={[
                      safeWidth,
                      safeHeight,
                      safeDepth
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
            </Center>
          )}
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
            floorY,
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
            "rgba(255,255,255,0.82)",
          color: "#404850",
          fontSize: "12px",
          pointerEvents: "none"
        }}
      >
    
      </div>
    </div>
  );
}
