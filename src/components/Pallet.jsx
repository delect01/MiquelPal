import { Edges } from "@react-three/drei";

import {
  PALLET_CONFIG
} from "../Config/geometryConfig";

import {
  getPalletCenterThree,
  getPalletSizeThree
} from "../utils/palletGeometry";

export default function Pallet({
  pallet = PALLET_CONFIG
}) {
  const palletCenterThree =
    getPalletCenterThree(pallet);

  const palletSizeThree =
    getPalletSizeThree(pallet);

  return (
    <mesh
      position={[
        palletCenterThree.x,
        palletCenterThree.y,
        palletCenterThree.z
      ]}
      castShadow
      receiveShadow
    >
      <boxGeometry
        args={[
          palletSizeThree.width,
          palletSizeThree.height,
          palletSizeThree.depth
        ]}
      />

      <meshStandardMaterial
        color={
          pallet.color ??
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
  );
}