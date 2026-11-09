import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import StaticPiece from "./StaticPiece.jsx";
import AppliedGripper from "./AppliedGripper.jsx";
import { getPieceGripperPose } from "../utils/graspGeometry.js";

// Velocitat del moviment lineal simulat
const SPEED_MM_PER_SECOND = 100;
const MIN_DURATION_SECONDS = 1.5;
const MAX_DURATION_SECONDS = 8;

// Pausa a la posició inicial perquè l'operari la vegi
const DEFAULT_START_PAUSE_SECONDS = 0.6;

/*
  Vector WORLD de l'offset: X/Y segons els eixos de la
  cara de contacte i Z segons la direcció d'atac,
  exactament com AppliedGripper.
*/
function getOffsetWorldVector(pose, offset) {
  return new THREE.Vector3()
    .addScaledVector(pose.tangentX, Number(offset?.x) || 0)
    .addScaledVector(pose.tangentY, Number(offset?.y) || 0)
    .addScaledVector(pose.toolZ, Number(offset?.z) || 0);
}

/*
  Animació lineal, sense canviar l'orientació:

  - approach: la pinça surt del punt d'aproximació i
    arriba a la posició de la peça.
  - retreat: la pinça surt de la peça i s'allunya fins
    al punt d'allunyament.

  carriesPiece indica si la peça viatja amb la pinça
  o es queda quieta al seu lloc:
  - paletitzar: la porta a l'aproximació, no a
    l'allunyament (per defecte);
  - despaletitzar: al revés.

  Al final es queda aturada fins que s'acaba la
  simulació (Esc). onFinished avisa una sola vegada
  quan arriba al punt final, per encadenar moviments.
*/
/*
  Agafada múltiple: pieces són totes les peces del grup
  (es mouen juntes) i pose és la de la pinça del grup.
  Sense aquestes dades, una sola peça amb el seu TCP.
*/
export default function OffsetSimulation({
  piece,
  pieces = null,
  pose = null,
  gripper,
  offset,
  mode,
  carriesPiece = mode === "approach",
  startPauseSeconds = DEFAULT_START_PAUSE_SECONDS,
  speed = 1,
  onFinished
}) {
  const movingGroupRef = useRef(null);
  const elapsedRef = useRef(0);
  const hasFinishedRef = useRef(false);

  const carriedPieces = pieces ?? [piece];
  const gripperPose = useMemo(
    () => pose ?? getPieceGripperPose(piece),
    [pose, piece]
  );

  const offsetVector = useMemo(
    () => getOffsetWorldVector(gripperPose, offset),
    [gripperPose, offset]
  );

  const duration = THREE.MathUtils.clamp(
    offsetVector.length() / SPEED_MM_PER_SECOND,
    MIN_DURATION_SECONDS,
    MAX_DURATION_SECONDS
  );

  function getProgress(elapsedSeconds) {
    return THREE.MathUtils.clamp(
      (elapsedSeconds - startPauseSeconds) / duration,
      0,
      1
    );
  }

  // Fracció de l'offset aplicada en cada moment
  function getOffsetFactor(progress) {
    return mode === "approach" ? 1 - progress : progress;
  }

  const initialPosition = offsetVector
    .clone()
    .multiplyScalar(getOffsetFactor(0));

  useFrame((_, deltaSeconds) => {
    if (!movingGroupRef.current) {
      return;
    }

    // La velocitat es pot canviar a mig moviment
    elapsedRef.current += deltaSeconds * speed;

    const progress = getProgress(elapsedRef.current);

    movingGroupRef.current.position
      .copy(offsetVector)
      .multiplyScalar(getOffsetFactor(progress));

    if (progress >= 1 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      onFinished?.();
    }
  });

  return (
    <>
      {!carriesPiece &&
        carriedPieces.map((item) => (
          <StaticPiece key={item.id} piece={item} />
        ))}

      <group
        ref={movingGroupRef}
        position={[
          initialPosition.x,
          initialPosition.y,
          initialPosition.z
        ]}
      >
        {carriesPiece &&
          carriedPieces.map((item) => (
            <StaticPiece key={item.id} piece={item} />
          ))}

        {gripper && (
          <AppliedGripper gripper={gripper} piece={piece} pose={gripperPose} />
        )}
      </group>
    </>
  );
}
