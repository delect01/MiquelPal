import {
  useEffect,
  useState
} from "react";
import {
  loadStoredModel
} from "../utils/modelLoader.js";

const DIMMED_OPACITY = 0.24;

function saveOriginalMaterialState(material) {
  const state =
    material.userData
      .originalImportedMaterialState;

  if (state) {
    return state;
  }

  const originalState = {
    color:
      material.color?.getHex?.() ??
      0xf28c28,
    opacity:
      Number(material.opacity ?? 1),
    transparent:
      Boolean(material.transparent),
    depthWrite:
      material.depthWrite !== false,
    depthTest:
      material.depthTest !== false
  };

  material.userData
    .originalImportedMaterialState =
    originalState;

  return originalState;
}

function applyVisualState(
  object,
  visualState,
  dimmed
) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    const materials =
      Array.isArray(child.material)
        ? child.material
        : [child.material];

    materials.forEach((material) => {
      if (!material) {
        return;
      }

      const originalState =
        saveOriginalMaterialState(
          material
        );

      if (visualState === "selected") {
        material.color?.set("#ff0000");
      } else if (
        visualState === "colliding"
      ) {
        material.color?.set("#1565ff");
      } else if (
        visualState === "outside"
      ) {
        material.color?.set("#ffd000");
      } else {
        material.color?.setHex(
          originalState.color
        );
      }

      if (dimmed) {
        material.transparent = true;
        material.opacity =
          Math.min(
            originalState.opacity,
            DIMMED_OPACITY
          );
        material.depthWrite = false;
        material.depthTest = true;
      } else {
        material.transparent =
          originalState.transparent;
        material.opacity =
          originalState.opacity;
        material.depthWrite =
          originalState.depthWrite;
        material.depthTest =
          originalState.depthTest;
      }

      material.needsUpdate = true;
    });
  });
}

export default function ImportedPieceModel({
  modelId,
  bottomFace = "NEGATIVE_Y",
  visualState = "normal",
  dimmed = false
}) {
  const [object, setObject] =
    useState(null);

  useEffect(() => {
    let active = true;

    setObject(null);

    loadStoredModel(
      modelId,
      bottomFace
    )
      .then((result) => {
        if (!active) {
          return;
        }

        setObject(result.object);
      })
      .catch((error) => {
        console.error(
          "No s'ha pogut carregar el model 3D:",
          error
        );
      });

    return () => {
      active = false;
    };
  }, [
    modelId,
    bottomFace
  ]);

  useEffect(() => {
    if (!object) {
      return;
    }

    applyVisualState(
      object,
      visualState,
      dimmed
    );
  }, [
    object,
    visualState,
    dimmed
  ]);

  if (!object) {
    return null;
  }

  return (
    <primitive object={object} />
  );
}
