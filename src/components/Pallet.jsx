import { useEffect, useState } from "react";
import { Edges } from "@react-three/drei";
import { PALLET_CONFIG } from "../Config/geometryConfig";
import { getPalletCenterThree, getPalletSizeThree } from "../utils/palletGeometry";
import { loadTransformedStoredModel } from "../utils/modelLoader.js";

function applyImportedColor(
  object,
  color
) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const originalMaterials =
      Array.isArray(child.material)
        ? child.material
        : [child.material];

    const coloredMaterials =
      originalMaterials.map((material) => {
        const clonedMaterial =
          material.clone();

        if (clonedMaterial.color) {
          clonedMaterial.color.set(
            color || "#8b5a2b"
          );
        }

        clonedMaterial.needsUpdate =
          true;

        return clonedMaterial;
      });

    child.material =
      Array.isArray(child.material)
        ? coloredMaterials
        : coloredMaterials[0];
  });

  return object;
}

function ImportedPallet({ pallet }) {
  const [object, setObject] = useState(null);
  const data = pallet.modelData ?? {};

  useEffect(() => {
    let cancelled = false;
    if (!data.modelId) return undefined;
    loadTransformedStoredModel(data.modelId, data)
      .then((result) => {
        if (!cancelled) {
          setObject(
            applyImportedColor(
              result.object,
              pallet.color
            )
          );
        }
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [
    data.modelId,
    data.modelBottomFace,
    data.rotationX,
    data.rotationY,
    data.rotationZ,
    pallet.color
  ]);

  return object ? <primitive object={object} /> : null;
}

export default function Pallet({ pallet = PALLET_CONFIG }) {
  if (pallet.modelType === "IMPORTED_3D" && pallet.modelData?.modelId) {
    return <ImportedPallet pallet={pallet} />;
  }

  const center = getPalletCenterThree(pallet);
  const size = getPalletSizeThree(pallet);
  return (
    <mesh position={[center.x, center.y, center.z]} castShadow receiveShadow>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshStandardMaterial color={pallet.color ?? "#8b5a2b"} roughness={0.8} metalness={0} />
      <Edges threshold={15} color="black" />
    </mesh>
  );
}
