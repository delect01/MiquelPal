import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Edges,
  OrbitControls
} from "@react-three/drei";
import * as THREE from "three";

function SeparatorGeometry({
  width,
  depth,
  height,
  color
}) {
  const safeWidth = Math.max(
    Number(width) || 1,
    1
  );

  const safeDepth = Math.max(
    Number(depth) || 1,
    1
  );

  const safeHeight = Math.max(
    Number(height) || 0.1,
    0.1
  );

  const markerRadius = Math.max(
    Math.min(safeWidth, safeDepth) * 0.018,
    6
  );

  const axisLength = Math.max(
    Math.min(safeWidth, safeDepth) * 0.28,
    90
  );

  const xArrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0xff0000,
        22,
        10
      ),
    [axisLength]
  );

  const yArrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0x00aa00,
        22,
        10
      ),
    [axisLength]
  );

  const zArrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0x0000ff,
        22,
        10
      ),
    [axisLength]
  );

  return (
    <group>
      <mesh>
        <boxGeometry
          args={[
            safeWidth,
            safeHeight,
            safeDepth
          ]}
        />

        <meshStandardMaterial
          color={color || "#d4b483"}
          roughness={0.82}
          metalness={0}
        />

        <Edges
          threshold={15}
          color="#66533a"
        />
      </mesh>

      <group
        position={[
          0,
          safeHeight / 2 + 1,
          0
        ]}
      >
        <mesh>
          <sphereGeometry
            args={[
              markerRadius,
              18,
              18
            ]}
          />

          <meshStandardMaterial
            color="#22c55e"
          />
        </mesh>

        <primitive object={xArrow} />
        <primitive object={yArrow} />
        <primitive object={zArrow} />
      </group>
    </group>
  );
}

export default function SeparatorPreview({
  width,
  depth,
  height,
  color
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "360px",
        overflow: "hidden",
        border: "1px solid #aeb6bf",
        borderRadius: "8px",
        background: "#eef1f4"
      }}
    >
      <Canvas
        camera={{
          position: [900, 650, 900],
          fov: 42,
          near: 0.1,
          far: 100000
        }}
      >
        <color
          attach="background"
          args={["#eef1f4"]}
        />

        <ambientLight intensity={1.15} />

        <directionalLight
          position={[600, 1000, 700]}
          intensity={1.5}
        />

        <Bounds
          fit
          clip
          observe
          margin={1.35}
        >
          <Center>
            <SeparatorGeometry
              width={width}
              depth={depth}
              height={height}
              color={color}
            />
          </Center>
        </Bounds>

        <OrbitControls
          makeDefault
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
