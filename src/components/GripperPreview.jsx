import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, Edges, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ImportedGripperModel from "./ImportedGripperModel.jsx";

function ArrowSet({ position, quaternion, length }) {
  const arrows = useMemo(() => [
    new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), length, 0xff0000, length * 0.18, length * 0.08),
    new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), length, 0x00aa00, length * 0.18, length * 0.08),
    new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), length, 0x0000ff, length * 0.18, length * 0.08)
  ], [length]);

  return (
    <group position={[position.x, position.y, position.z]} quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[Math.max(length * 0.08, 3), 18, 18]} />
        <meshStandardMaterial color="#22c55e" depthTest={false} />
      </mesh>
      {arrows.map((arrow, index) => <primitive key={index} object={arrow} />)}
    </group>
  );
}

function BoxGripper({ gripper }) {
  const sizeX = Math.max(Number(gripper.sizeX) || 1, 1);
  const sizeY = Math.max(Number(gripper.sizeY) || 1, 1);
  const sizeZ = Math.max(Number(gripper.sizeZ) || 1, 1);
  const offsetX = Number(gripper.offsetX) || 0;
  const offsetY = Number(gripper.offsetY) || 0;
  const tcpQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    THREE.MathUtils.degToRad(Number(gripper.robotFrontDeg) || 0)
  );

  return (
    <group>
      <mesh position={[0, 0, -sizeZ / 2]}>
        <boxGeometry args={[sizeX, sizeY, sizeZ]} />
        <meshStandardMaterial color={gripper.color || "#64748b"} transparent opacity={0.42} roughness={0.55} />
        <Edges threshold={15} color="#334155" />
      </mesh>
      <ArrowSet
        position={new THREE.Vector3(offsetX, offsetY, 0.5)}
        quaternion={tcpQuaternion}
        length={Math.max(Math.min(sizeX, sizeY, sizeZ) * 0.45, 60)}
      />
    </group>
  );
}

function ImportedTcpScene({ gripper, selectingTcp, onTcpSelected, onDimensions }) {
  const rootRef = useRef(null);
  const pointerStart = useRef(null);

  const tcpPosition = new THREE.Vector3(
    Number(gripper.tcpPosition?.x) || 0,
    Number(gripper.tcpPosition?.y) || 0,
    Number(gripper.tcpPosition?.z) || 0
  );
  const tcpQuaternion = new THREE.Quaternion(
    Number(gripper.tcpQuaternion?.x) || 0,
    Number(gripper.tcpQuaternion?.y) || 0,
    Number(gripper.tcpQuaternion?.z) || 0,
    Number(gripper.tcpQuaternion?.w) || 1
  ).normalize();
  const arrowLength = Math.max(Math.min(Number(gripper.sizeX) || 100, Number(gripper.sizeY) || 100, Number(gripper.sizeZ) || 100) * 0.45, 50);

  function chooseTcp(event) {
    if (!selectingTcp || !rootRef.current || !event.face) return;
    const start = pointerStart.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;

    event.stopPropagation();
    const localPoint = rootRef.current.worldToLocal(event.point.clone());
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(event.object.matrixWorld);
    const worldNormal = event.face.normal.clone().applyMatrix3(normalMatrix).normalize();
    const inverseRootQuaternion = rootRef.current.getWorldQuaternion(new THREE.Quaternion()).invert();
    const localNormal = worldNormal.applyQuaternion(inverseRootQuaternion).normalize();
    const orientation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      localNormal
    ).normalize();
    const euler = new THREE.Euler().setFromQuaternion(orientation, "XYZ");

    onTcpSelected({
      tcpDefined: true,
      tcpPosition: { x: localPoint.x, y: localPoint.y, z: localPoint.z },
      tcpQuaternion: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      tcpRotation: {
        rxDeg: THREE.MathUtils.radToDeg(euler.x),
        ryDeg: THREE.MathUtils.radToDeg(euler.y),
        rzDeg: THREE.MathUtils.radToDeg(euler.z)
      }
    });
  }

  return (
    <group ref={rootRef}>
      <group
        onPointerDown={(event) => {
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={chooseTcp}
      >
        <ImportedGripperModel
          modelId={gripper.modelId}
          bottomFace={gripper.modelBottomFace || "NEGATIVE_Y"}
          onLoaded={onDimensions}
        />
      </group>
      <ArrowSet position={tcpPosition} quaternion={tcpQuaternion} length={arrowLength} />
    </group>
  );
}

export default function GripperPreview({ gripper, selectingTcp, onTcpSelected, onImportedDimensions }) {
  const lastDimensionsRef = useRef("");

  const handleLoaded = useCallback((result) => {
    const dimensions = result.dimensions;
    const signature = JSON.stringify({
      width: Number(dimensions?.width) || 0,
      height: Number(dimensions?.height) || 0,
      depth: Number(dimensions?.depth) || 0
    });

    if (lastDimensionsRef.current === signature) {
      return;
    }

    lastDimensionsRef.current = signature;
    onImportedDimensions?.(dimensions);
  }, [onImportedDimensions]);

  const imported = gripper.modelType === "IMPORTED_3D" && Boolean(gripper.modelId);

  return (
    <div style={{ width: "100%", height: "360px", border: "1px solid #aeb6bf", borderRadius: "8px", overflow: "hidden", background: "#eef1f4" }}>
      <Canvas camera={{ position: [500, 420, 620], fov: 42, near: 0.1, far: 100000 }}>
        <color attach="background" args={["#eef1f4"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[500, 700, 500]} intensity={1.5} />
        <Bounds fit clip observe margin={1.45}>
          {imported ? (
            <ImportedTcpScene
              gripper={gripper}
              selectingTcp={selectingTcp}
              onTcpSelected={onTcpSelected}
              onDimensions={handleLoaded}
            />
          ) : (
            <Center><BoxGripper gripper={gripper} /></Center>
          )}
        </Bounds>
        <OrbitControls makeDefault enablePan={false} />
      </Canvas>
    </div>
  );
}
