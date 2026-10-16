import {
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import { resolve } from "node:path";

const modelPath = resolve(
  process.cwd(),
  "src/components/ImportedGripperModel.jsx"
);
const previewPath = resolve(
  process.cwd(),
  "src/components/GripperPreview.jsx"
);

const modelBackup = `${modelPath}.freeze-fix-backup`;
const previewBackup = `${previewPath}.freeze-fix-backup`;

let modelSource = await readFile(modelPath, "utf8");
let previewSource = await readFile(previewPath, "utf8");

await copyFile(modelPath, modelBackup);
await copyFile(previewPath, previewBackup);

/* ImportedGripperModel: onLoaded ja no reinicia la carrega del model a cada render. */
modelSource = modelSource.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useRef, useState } from "react";'
);

if (!modelSource.includes("const onLoadedRef = useRef")) {
  modelSource = modelSource.replace(
`  const [object, setObject] = useState(null);`,
`  const [object, setObject] = useState(null);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);`
  );
}

modelSource = modelSource.replace(
  "        onLoaded?.(result);",
  "        onLoadedRef.current?.(result);"
);

modelSource = modelSource.replace(
`  }, [modelId, bottomFace, onLoaded]);`,
`  }, [modelId, bottomFace]);`
);

/* GripperPreview: no tornem a escriure dimensions si no han canviat. */
if (!previewSource.includes("lastDimensionsRef")) {
  previewSource = previewSource.replace(
`export default function GripperPreview({ gripper, selectingTcp, onTcpSelected, onImportedDimensions }) {
  const handleLoaded = useCallback((result) => {
    onImportedDimensions?.(result.dimensions);
  }, [onImportedDimensions]);`,
`export default function GripperPreview({ gripper, selectingTcp, onTcpSelected, onImportedDimensions }) {
  const lastDimensionsRef = useRef("");

  const handleLoaded = useCallback((result) => {
    const dimensions = result.dimensions;
    const signature = JSON.stringify({
      width: Number(dimensions?.width) || 0,
      height: Number(dimensions?.height) || 0,
      depth: Number(dimensions?.depth) || 0
    });

    if (lastDimensionsRef.current === signature) {
      return;
    }

    lastDimensionsRef.current = signature;
    onImportedDimensions?.(dimensions);
  }, [onImportedDimensions]);`
  );
}

await writeFile(modelPath, modelSource, "utf8");
await writeFile(previewPath, previewSource, "utf8");

const checks = {
  callbackRef: modelSource.includes("onLoadedRef.current?.(result)"),
  stableLoadEffect: modelSource.includes("}, [modelId, bottomFace]);"),
  dimensionGuard: previewSource.includes("lastDimensionsRef.current === signature")
};

console.log("VERIFICACIO:", checks);

if (Object.values(checks).some((value) => !value)) {
  throw new Error("La verificacio ha fallat. Pots restaurar les copies de seguretat.");
}

console.log("[OK] Eliminat el bucle infinit de carrega i actualitzacio de dimensions.");
console.log(`Copies: ${modelBackup} i ${previewBackup}`);
