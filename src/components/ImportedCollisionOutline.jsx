import {
  useEffect,
  useMemo
} from "react";
import {
  Edges
} from "@react-three/drei";
import {
  createCollisionBufferGeometry
} from "../utils/importedGeometry.js";

export default function ImportedCollisionOutline({
  collisionGeometry,
  color = "white",
  visible = true
}) {
  const geometry = useMemo(
    () =>
      collisionGeometry
        ? createCollisionBufferGeometry(
            collisionGeometry
          )
        : null,
    [collisionGeometry]
  );

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry || !visible) {
    return null;
  }

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        colorWrite={false}
      />

      <Edges
        threshold={10}
        color={color}
      />
    </mesh>
  );
}
