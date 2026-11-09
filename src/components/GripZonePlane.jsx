import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { GRASP_COLOR } from "../utils/graspGroups.js";

const GRIP_ZONE_FILL = "#c084fc";
// Una mica per fora de la cara de la pinça (Z de l'eina)
const GRIP_ZONE_LIFT = 0.6;

/*
  Zona d'agafada de la pinça, en lila: rectangle al pla
  XY del marc on es dibuixa (el TCP o la cara de la
  pinça). No intercepta els clics.
*/
export default function GripZonePlane({ zone, opacity = 0.4 }) {
  if (!zone || !(zone.sizeX > 0) || !(zone.sizeY > 0)) {
    return null;
  }

  return (
    <mesh
      position={[zone.centerX, zone.centerY, GRIP_ZONE_LIFT]}
      renderOrder={7}
      raycast={() => null}
    >
      <planeGeometry args={[zone.sizeX, zone.sizeY]} />
      <meshBasicMaterial
        color={GRIP_ZONE_FILL}
        side={THREE.DoubleSide}
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
      <Edges color={GRASP_COLOR} />
    </mesh>
  );
}
