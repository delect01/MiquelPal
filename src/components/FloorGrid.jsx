import {
  useEffect,
  useRef
} from "react";

export default function FloorGrid({
  palletHeight
}) {
  const gridRef =
    useRef(null);

  useEffect(() => {
    if (!gridRef.current) {
      return;
    }

    const gridMaterial =
      gridRef.current.material;

    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.42;
    gridMaterial.depthWrite = false;

    gridMaterial.needsUpdate = true;
  }, []);

  return (
    <gridHelper
      ref={gridRef}
      args={[
        5000,
        100,
        "#9aabba",
        "#d8dee5"
      ]}
      position={[
        0,
        -Number(palletHeight) - 0.1,
        0
      ]}
      renderOrder={-1}
    />
  );
}