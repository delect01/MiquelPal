import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { getReferenceAxes, getReferenceWorldPositionThree } from "../utils/pieceUtils";
import { loadStoredModel } from "../utils/modelLoader.js";

function ImportedAppliedModel({ gripper, matrix }) {
  const [object, setObject] = useState(null);
  useEffect(() => {
    let active = true;
    loadStoredModel(gripper.modelId, gripper.modelBottomFace || "NEGATIVE_Y")
      .then((result) => {
        if (active) setObject(result.object);
      })
      .catch((error) => console.error("No s'ha pogut carregar la gripper aplicada:", error));
    return () => { active = false; };
  }, [gripper.modelId, gripper.modelBottomFace]);

  if (!object) return null;
  return <primitive object={object} matrix={matrix} matrixAutoUpdate={false} raycast={() => null} />;
}

export default function AppliedGripper({ gripper, piece, offsetPreview = null }) {
  const axes = getReferenceAxes(piece, true, true);
  const tcpPosition = getReferenceWorldPositionThree(piece);

  const targetMatrix = useMemo(() => {
    const position = tcpPosition.clone();
    if (offsetPreview) {
      position.addScaledVector(axes.tangentX, Number(offsetPreview.x) || 0);
      position.addScaledVector(axes.tangentY, Number(offsetPreview.y) || 0);
      position.addScaledVector(axes.toolZ, Number(offsetPreview.z) || 0);
    }

    const basis = new THREE.Matrix4().makeBasis(
      axes.tangentX.clone().normalize(),
      axes.tangentY.clone().normalize(),
      axes.toolZ.clone().normalize()
    );
    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(basis).normalize();
    const robotFront = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(Number(gripper.robotFrontDeg) || 0)
    );
    targetQuaternion.multiply(robotFront).normalize();
    return new THREE.Matrix4().compose(position, targetQuaternion, new THREE.Vector3(1, 1, 1));
  }, [piece, gripper.robotFrontDeg, offsetPreview?.x, offsetPreview?.y, offsetPreview?.z]);

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
    return <ImportedAppliedModel gripper={gripper} matrix={worldModelMatrix} />;
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
          <meshStandardMaterial color="#1e3a5f" side={THREE.DoubleSide} transparent opacity={0.82} depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
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
