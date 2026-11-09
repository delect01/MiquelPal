import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { getPieceGripperPose, getPoseQuaternion } from "../utils/graspGeometry.js";
import { loadStoredModel } from "../utils/modelLoader.js";
import { buildGripperTargetMatrix } from "../utils/gripperTransform.js";

// Pinça "fantasma" (definir agafades): deixa veure i clicar les peces
const GHOST_OPACITY = 0.3;

function makeGhost(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      material.transparent = true;
      material.opacity = Math.min(Number(material.opacity ?? 1), GHOST_OPACITY);
      material.depthWrite = false;
    });
  });
}

function ImportedAppliedModel({ gripper, matrix, ghost = false }) {
  const [object, setObject] = useState(null);
  useEffect(() => {
    let active = true;
    loadStoredModel(gripper.modelId, gripper.modelBottomFace || "NEGATIVE_Y")
      .then((result) => {
        if (ghost) makeGhost(result.object);
        if (active) setObject(result.object);
      })
      .catch((error) => console.error("No s'ha pogut carregar la gripper aplicada:", error));
    return () => { active = false; };
  }, [gripper.modelId, gripper.modelBottomFace, ghost]);

  if (!object) return null;
  return <primitive object={object} matrix={matrix} matrixAutoUpdate={false} raycast={() => null} />;
}

/*
  Pinça sobre una peça (el seu TCP) o, si es passa pose,
  sobre una agafada múltiple (TCP del grup amb la
  direcció de l'eina de la peça guia).
*/
export default function AppliedGripper({ gripper, piece, pose = null, offsetPreview = null }) {
  const targetMatrix = useMemo(() => {
    const basePose = pose ?? getPieceGripperPose(piece);
    const position = basePose.position.clone();
    if (offsetPreview) {
      position.addScaledVector(basePose.tangentX, Number(offsetPreview.x) || 0);
      position.addScaledVector(basePose.tangentY, Number(offsetPreview.y) || 0);
      position.addScaledVector(basePose.toolZ, Number(offsetPreview.z) || 0);
    }

    return buildGripperTargetMatrix(gripper, position, getPoseQuaternion(basePose));
  }, [piece, pose, gripper, offsetPreview]);

  return <GripperModel gripper={gripper} targetMatrix={targetMatrix} />;
}

/*
  Dibuix de la pinça amb la seva Z de l'eina col·locada
  a targetMatrix (en l'espai del grup pare).
*/
export function GripperModel({ gripper, targetMatrix, ghost = false }) {

  if (gripper.modelType === "IMPORTED_3D" && gripper.modelId) {
    const tcpPositionLocal = new THREE.Vector3(
      Number(gripper.tcpPosition?.x) || 0,
      Number(gripper.tcpPosition?.y) || 0,
      Number(gripper.tcpPosition?.z) || 0
    );
    const tcpQuaternionLocal = new THREE.Quaternion(
      Number(gripper.tcpQuaternion?.x) || 0,
      Number(gripper.tcpQuaternion?.y) || 0,
      Number(gripper.tcpQuaternion?.z) || 0,
      Number(gripper.tcpQuaternion?.w) || 1
    ).normalize();
    const localTcpMatrix = new THREE.Matrix4().compose(
      tcpPositionLocal,
      tcpQuaternionLocal,
      new THREE.Vector3(1, 1, 1)
    );
    const worldModelMatrix = targetMatrix.clone().multiply(localTcpMatrix.invert());
    return <ImportedAppliedModel gripper={gripper} matrix={worldModelMatrix} ghost={ghost} />;
  }

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  targetMatrix.decompose(position, quaternion, new THREE.Vector3());
  const sizeX = Math.max(Number(gripper.sizeX) || 1, 1);
  const sizeY = Math.max(Number(gripper.sizeY) || 1, 1);
  const sizeZ = Math.max(Number(gripper.sizeZ) || 1, 1);
  const offsetX = Number(gripper.offsetX) || 0;
  const offsetY = Number(gripper.offsetY) || 0;
  const neckRadius = Math.max(Math.min(sizeX, sizeY) * 0.18, 8);
  const neckLength = Math.max(sizeZ * 0.65, 30);

  return (
    <group position={[position.x, position.y, position.z]} quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}>
      <group position={[-offsetX, -offsetY, -0.5]}>
        <mesh position={[0, 0, -sizeZ / 2]} renderOrder={5} raycast={() => null}>
          <boxGeometry args={[sizeX, sizeY, sizeZ]} />
          <meshStandardMaterial color={gripper.color || "#64748b"} transparent opacity={0.28} depthWrite={false} roughness={0.55} />
          <Edges threshold={15} color="#475569" />
        </mesh>
        <mesh position={[0, 0, 0.1]} renderOrder={6} raycast={() => null}>
          <planeGeometry args={[sizeX, sizeY]} />
          <meshStandardMaterial color="#1e3a5f" side={THREE.DoubleSide} transparent opacity={ghost ? 0.3 : 0.82} depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
        <mesh position={[0, 0, -(sizeZ + neckLength / 2)]} rotation={[Math.PI / 2, 0, 0]} renderOrder={5} raycast={() => null}>
          <cylinderGeometry args={[neckRadius, neckRadius, neckLength, 32]} />
          <meshStandardMaterial color="#475569" transparent opacity={0.38} depthWrite={false} roughness={0.5} />
          <Edges threshold={15} color="#475569" />
        </mesh>
      </group>
    </group>
  );
}
