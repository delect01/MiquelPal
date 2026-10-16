import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Edges, OrbitControls } from "@react-three/drei";
import { loadTransformedStoredModel } from "../utils/modelLoader.js";

function ImportedPreview({ modelData, color }) {
  const [object, setObject] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!modelData?.modelId) return undefined;
    loadTransformedStoredModel(modelData.modelId, modelData)
      .then((result) => {
        if (!cancelled) {
          result.object.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            const colored = materials.map((material) => {
              const clone = material.clone();
              if (clone.color) clone.color.set(color || "#8b5a2b");
              clone.needsUpdate = true;
              return clone;
            });
            child.material = Array.isArray(child.material)
              ? colored
              : colored[0];
          });
          setObject(result.object);
        }
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [modelData?.modelId, modelData?.modelBottomFace, modelData?.rotationX, modelData?.rotationY, modelData?.rotationZ, color]);
  return object ? <primitive object={object} /> : null;
}

export default function PalletPreview({ sizeX, sizeY, sizeZ, color, modelType, modelData }) {
  const x = Number(sizeX) || 1;
  const y = Number(sizeY) || 1;
  const z = Number(sizeZ) || 1;
  const imported = modelType === "IMPORTED_3D" && modelData?.modelId;

  return (
    <div style={{ width: "100%", height: "320px", position: "relative", background: "#eef1f4", border: "1px solid #aeb6bf", borderRadius: "8px", overflow: "hidden" }}>
      <Canvas shadows camera={{ position: [600, 450, 600], near: 0.1, far: 100000, fov: 45 }}>
        <color attach="background" args={["#eef1f4"]} />
        <ambientLight intensity={1.1} />
        <directionalLight castShadow position={[600, 900, 600]} intensity={1.5} />
        <Bounds fit clip observe margin={1.4}>
          {imported ? <ImportedPreview modelData={modelData} color={color} /> : (
            <mesh position={[y / 2, -z / 2, x / 2]} castShadow receiveShadow>
              <boxGeometry args={[y, z, x]} />
              <meshStandardMaterial color={color || "#8b5a2b"} roughness={0.8} metalness={0} />
              <Edges threshold={15} color="black" />
            </mesh>
          )}
        </Bounds>
        <gridHelper
          args={[
            Math.max(x, y, z, 100) * 2.5,
            20,
            "#8f99a5",
            "#c3c9d0"
          ]}
          position={[0, -z, 0]}
        />
        <axesHelper args={[Math.max(100, Math.min(x, y) * 0.15)]} />
        <OrbitControls makeDefault enableRotate enableZoom enablePan={false} />
      </Canvas>
    </div>
  );
}
