import { useEffect, useRef, useState } from "react";
import { loadStoredModel } from "../utils/modelLoader.js";

export default function ImportedGripperModel({
  modelId,
  bottomFace = "NEGATIVE_Y",
  onLoaded
}) {
  const [object, setObject] = useState(null);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    let active = true;
    setObject(null);

    loadStoredModel(modelId, bottomFace)
      .then((result) => {
        if (!active) return;
        setObject(result.object);
        onLoadedRef.current?.(result);
      })
      .catch((error) => {
        console.error("No s'ha pogut carregar la gripper 3D:", error);
      });

    return () => {
      active = false;
    };
  }, [modelId, bottomFace]);

  return object ? <primitive object={object} /> : null;
}
