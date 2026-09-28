//Pallet preview

import {
  Canvas
} from "@react-three/fiber";

import {
  Bounds,
  Center,
  Edges,
  OrbitControls
} from "@react-three/drei";

export default function PalletPreview({
  sizeX,
  sizeY,
  sizeZ,
  color
}) {
  const safeSizeX =
    Number(sizeX) > 0
      ? Number(sizeX)
      : 1;

  const safeSizeY =
    Number(sizeY) > 0
      ? Number(sizeY)
      : 1;

  const safeSizeZ =
    Number(sizeZ) > 0
      ? Number(sizeZ)
      : 1;

  const maximumSize =
    Math.max(
      safeSizeX,
      safeSizeY,
      safeSizeZ,
      100
    );

  return (
    <div
      style={{
        width: "100%",
        height: "320px",
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
            600,
            450,
            600
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
            600,
            900,
            600
          ]}
          intensity={1.5}
        />

        <directionalLight
          position={[
            -500,
            350,
            -500
          ]}
          intensity={0.6}
        />

        <Bounds
          fit
          clip
          observe
          margin={1.4}
        >
          <Center>
            <mesh
              castShadow
              receiveShadow
            >
              {/*
                Three X correspon a Y pallet.
                Three Y correspon a Z pallet.
                Three Z correspon a X pallet.
              */}
              <boxGeometry
                args={[
                  safeSizeY,
                  safeSizeZ,
                  safeSizeX
                ]}
              />

              <meshStandardMaterial
                color={
                  color ||
                  "#8b5a2b"
                }
                roughness={0.8}
                metalness={0}
              />

              <Edges
                threshold={15}
                color="black"
              />
            </mesh>
          </Center>
        </Bounds>

        <gridHelper
          args={[
            maximumSize * 2.5,
            20,
            "#8f99a5",
            "#c3c9d0"
          ]}
          position={[
            0,
            -safeSizeZ / 2,
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
            "rgba(255, 255, 255, 0.84)",
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