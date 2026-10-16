import { useRef, useState } from "react";
import { inspectModelFile } from "../utils/modelLoader.js";
import { saveImportedModel } from "../utils/modelStorage.js";

export default function Import3DButton({ onImported, t }) {
  const inputRef = useRef(null);
  const [unit, setUnit] = useState("mm");
  const [working, setWorking] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setWorking(true);

    try {
      const bottomFace = "NEGATIVE_Y";
      const inspected = await inspectModelFile(file, unit, bottomFace);
      const saved = await saveImportedModel({
        file,
        format: inspected.format,
        unit,
        dimensions: inspected.dimensions
      });

      onImported({
        name: file.name.replace(/\.[^.]+$/, ""),
        pieceType: "IMPORTED_3D",
        modelType: "IMPORTED_3D",
        modelId: saved.id,
        modelName: saved.name,
        modelFormat: saved.format,
        modelUnit: saved.unit,
        modelBottomFace: bottomFace,
        collisionGeometry: inspected.collisionGeometry,
        dimensions: inspected.dimensions,
        ...inspected.dimensions,
        topWidth: inspected.dimensions.width,
        topDepth: inspected.dimensions.depth
      });
    } catch (error) {
      console.error(error);
      window.alert(error.message ?? t?.gripperDialog?.importError ??
        "No s'ha pogut importar el model 3D.");
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", gap: "6px", flex: 1 }}>
      <select
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
        disabled={working}
        aria-label={t?.gripperDialog?.modelUnits ?? "Unitats del model 3D"}
        style={{ width: "70px", borderRadius: "5px" }}
      >
        <option value="mm">mm</option>
        <option value="cm">cm</option>
        <option value="m">m</option>
      </select>

      <input
        ref={inputRef}
        type="file"
        accept=".glb,.stl,model/gltf-binary,model/stl"
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <button
        type="button"
        disabled={working}
        onClick={() => inputRef.current?.click()}
        style={{
          flex: 1,
          padding: "8px 10px",
          border: "1px solid #2767c5",
          borderRadius: "5px",
          background: working ? "#eceff2" : "#ffffff",
          color: working ? "#68727c" : "#2767c5",
          cursor: working ? "wait" : "pointer"
        }}
      >
        {working
          ? (t?.gripperDialog?.importing ?? "Important...")
          : (t?.gripperDialog?.import3D ?? "Importar 3D")}
      </button>
    </div>
  );
}
