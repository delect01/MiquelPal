import { useEffect, useState } from "react";
import * as THREE from "three";
import GripperPreview from "./GripperPreview.jsx";
import Import3DButton from "./Import3DButton.jsx";

const STORAGE_KEY = "pallet-simulator-gripper-library";

const defaultTcpPosition = () => ({ x: 0, y: 0, z: 0 });
const defaultTcpQuaternion = () => ({ x: 0, y: 0, z: 0, w: 1 });
const defaultTcpRotation = () => ({ rxDeg: 0, ryDeg: 0, rzDeg: 0 });

function loadLibrary() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("No s'ha pogut carregar la biblioteca de grippers:", error);
    return [];
  }
}

function saveLibrary(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("No s'ha pogut guardar la biblioteca de grippers:", error);
    return false;
  }
}

function createForm(gripper) {
  return {
    name: gripper?.name || "",
    sizeX: Number(gripper?.sizeX ?? 300),
    sizeY: Number(gripper?.sizeY ?? 180),
    sizeZ: Number(gripper?.sizeZ ?? 80),
    offsetX: Number(gripper?.offsetX ?? 0),
    offsetY: Number(gripper?.offsetY ?? 0),
    robotFrontDeg: Number(gripper?.robotFrontDeg ?? 0),
    color: gripper?.color || "#64748b",
    modelType: gripper?.modelType || "BOX",
    modelId: gripper?.modelId || null,
    modelName: gripper?.modelName || null,
    modelFormat: gripper?.modelFormat || null,
    modelUnit: gripper?.modelUnit || null,
    modelBottomFace: gripper?.modelBottomFace || "NEGATIVE_Y",
    tcpDefined: Boolean(gripper?.tcpDefined),
    tcpPosition: { ...defaultTcpPosition(), ...gripper?.tcpPosition },
    tcpQuaternion: { ...defaultTcpQuaternion(), ...gripper?.tcpQuaternion },
    tcpRotation: { ...defaultTcpRotation(), ...gripper?.tcpRotation }
  };
}

function NumericField({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#404850", fontSize: "11px", fontWeight: 700 }}>
      {label}
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: "100%", height: "31px", boxSizing: "border-box", padding: "0 7px", border: "1px solid #aeb6bf", borderRadius: "5px" }}
      />
    </label>
  );
}

export default function GripperDialog({ open, activeGripper, onClose, onApplyGripper, t }) {
  const [form, setForm] = useState(() => createForm(activeGripper));
  const [library, setLibrary] = useState(loadLibrary);
  const [selectedId, setSelectedId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectingTcp, setSelectingTcp] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createForm(activeGripper));
    setLibrary(loadLibrary());
    setSelectedId("");
    setFeedback("");
    setSelectingTcp(false);
  }, [open, activeGripper]);

  if (!open) return null;

  const imported = form.modelType === "IMPORTED_3D" && Boolean(form.modelId);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  function updateTcpPosition(axis, value) {
    setForm((current) => ({
      ...current,
      tcpDefined: true,
      tcpPosition: { ...current.tcpPosition, [axis]: Number(value) || 0 }
    }));
  }

  function updateTcpRotation(axis, value) {
    setForm((current) => {
      const rotation = { ...current.tcpRotation, [axis]: Number(value) || 0 };
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(rotation.rxDeg),
        THREE.MathUtils.degToRad(rotation.ryDeg),
        THREE.MathUtils.degToRad(rotation.rzDeg),
        "XYZ"
      );
      const quaternion = new THREE.Quaternion().setFromEuler(euler).normalize();
      return {
        ...current,
        tcpDefined: true,
        tcpRotation: rotation,
        tcpQuaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }
      };
    });
  }

  function validatedData() {
    const data = {
      ...form,
      name: form.name.trim(),
      sizeX: Number(form.sizeX),
      sizeY: Number(form.sizeY),
      sizeZ: Number(form.sizeZ),
      offsetX: Number(form.offsetX),
      offsetY: Number(form.offsetY),
      robotFrontDeg: Number(form.robotFrontDeg)
    };

    if (![data.sizeX, data.sizeY, data.sizeZ].every((value) => Number.isFinite(value) && value > 0)) {
      setFeedback(t.gripperDialog.invalidSizes);
      return null;
    }
    if (![data.offsetX, data.offsetY, data.robotFrontDeg].every(Number.isFinite)) {
      setFeedback(t.gripperDialog.invalidOffsets);
      return null;
    }
    if (data.modelType === "IMPORTED_3D" && (!data.modelId || !data.tcpDefined)) {
      setFeedback(t.gripperDialog.modelAndTcpRequired);
      return null;
    }
    return data;
  }

  function handleSave() {
    const data = validatedData();
    if (!data) return;
    if (!data.name) {
      setFeedback(t.gripperDialog.nameRequired);
      return;
    }
    const existing = library.find((item) => item.name.toLowerCase() === data.name.toLowerCase());
    const item = { ...data, id: existing?.id || window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` };
    const next = existing
      ? library.map((candidate) => candidate.id === existing.id ? item : candidate)
      : [...library, item];
    if (!saveLibrary(next)) return;
    setLibrary(next);
    setSelectedId(item.id);
    setFeedback(existing ? t.gripperDialog.updated : t.gripperDialog.saved);
  }

  function handleApply() {
    const data = validatedData();
    if (!data) return;
    onApplyGripper({ ...data, id: selectedId || activeGripper?.id || "active-gripper" });
    onClose();
  }

  const sectionStyle = { padding: "12px", border: "1px solid #d7dce1", borderRadius: "7px", marginBottom: "10px" };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(20,25,30,0.72)" }}>
      <div style={{ width: "min(1080px,96vw)", maxHeight: "94vh", overflowY: "auto", padding: "16px", borderRadius: "10px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div><h2 style={{ margin: 0 }}>{t.gripperDialog.title}</h2><div style={{ marginTop: "4px", color: "#59636e", fontSize: "13px" }}>{t.gripperDialog.subtitle}</div></div>
          <button type="button" onClick={onClose} style={{ width: "38px", height: "38px", borderRadius: "50%" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(330px,390px) minmax(480px,1fr)", gap: "16px" }}>
          <div>
            <section style={sectionStyle}>
              <h3 style={{ margin: "0 0 8px" }}>{t.gripperDialog.library}</h3>
              <select value={selectedId} onChange={(event) => {
                const id = event.target.value;
                setSelectedId(id);
                const selected = library.find((item) => item.id === id);
                if (selected) setForm(createForm(selected));
              }} style={{ width: "100%", height: "36px" }}>
                <option value="" disabled>{t.gripperDialog.list}</option>
                {[...library].sort((a, b) => a.name.localeCompare(b.name, "ca")).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button type="button" disabled={!selectedId} onClick={() => {
                  const next = library.filter((item) => item.id !== selectedId);
                  if (saveLibrary(next)) { setLibrary(next); setSelectedId(""); setForm(createForm(null)); }
                }} style={{ flex: 1 }}>{t.gripperDialog.deleteGripper}</button>
                <Import3DButton t={t} onImported={(model) => {
                  setForm((current) => ({
                    ...current,
                    name: model.name,
                    modelType: "IMPORTED_3D",
                    modelId: model.modelId,
                    modelName: model.modelName,
                    modelFormat: model.modelFormat,
                    modelUnit: model.modelUnit,
                    modelBottomFace: model.modelBottomFace,
                    sizeX: model.width,
                    sizeY: model.depth,
                    sizeZ: model.height,
                    tcpDefined: false,
                    tcpPosition: defaultTcpPosition(),
                    tcpQuaternion: defaultTcpQuaternion(),
                    tcpRotation: defaultTcpRotation()
                  }));
                  setSelectedId("");
                  setSelectingTcp(true);
                  setFeedback(t.gripperDialog.modelImported);
                }} />
              </div>
            </section>

            <section style={sectionStyle}>
              <h3 style={{ margin: "0 0 10px" }}>{t.gripperDialog.characteristics}</h3>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontWeight: 700 }}>{t.common.name}<input value={form.name} onChange={(event) => update("name", event.target.value)} style={{ height: "32px" }} /></label>
              {!imported && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "7px", marginTop: "10px" }}>
                  <NumericField label={t.gripperDialog.sizeX} value={form.sizeX} onChange={(value) => update("sizeX", value)} />
                  <NumericField label={t.gripperDialog.sizeY} value={form.sizeY} onChange={(value) => update("sizeY", value)} />
                  <NumericField label={t.gripperDialog.sizeZ} value={form.sizeZ} onChange={(value) => update("sizeZ", value)} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "7px", marginTop: "10px" }}>
                <NumericField label={t.gripperDialog.offsetX} value={form.offsetX} onChange={(value) => update("offsetX", value)} />
                <NumericField label={t.gripperDialog.offsetY} value={form.offsetY} onChange={(value) => update("offsetY", value)} />
                <NumericField label={t.gripperDialog.robotFront} value={form.robotFrontDeg} onChange={(value) => update("robotFrontDeg", value)} />
              </div>
            </section>

            {imported && (
              <section style={sectionStyle}>
                <h3 style={{ margin: "0 0 8px" }}>{t.gripperDialog.localTcp}</h3>
                <button type="button" onClick={() => setSelectingTcp((value) => !value)} style={{ width: "100%", padding: "9px", background: selectingTcp ? "#168447" : "#fff", color: selectingTcp ? "#fff" : "#168447", border: "1px solid #168447", borderRadius: "6px" }}>
                  {selectingTcp ? t.gripperDialog.selectingTcp : t.gripperDialog.selectTcp}
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "7px", marginTop: "10px" }}>
                  {(["x", "y", "z"]).map((axis) => <NumericField key={axis} label={`${t.gripperDialog.position} ${axis.toUpperCase()}`} value={form.tcpPosition[axis]} onChange={(value) => updateTcpPosition(axis, value)} />)}
                  <NumericField label="RX" value={form.tcpRotation.rxDeg} onChange={(value) => updateTcpRotation("rxDeg", value)} />
                  <NumericField label="RY" value={form.tcpRotation.ryDeg} onChange={(value) => updateTcpRotation("ryDeg", value)} />
                  <NumericField label="RZ" value={form.tcpRotation.rzDeg} onChange={(value) => updateTcpRotation("rzDeg", value)} />
                </div>
              </section>
            )}

            <button type="button" onClick={handleSave} style={{ width: "100%", padding: "10px", background: "#2767c5", color: "#fff", border: 0, borderRadius: "6px", fontWeight: 700 }}>{t.gripperDialog.saveCharacteristics}</button>
            {feedback && <div style={{ marginTop: "10px", padding: "8px", background: "#eef4fb", color: "#244d7c" }}>{feedback}</div>}
          </div>

          <div>
            <h3 style={{ margin: "0 0 8px" }}>{t.gripperDialog.preview3D}</h3>
            <GripperPreview
              gripper={form}
              selectingTcp={selectingTcp}
              onTcpSelected={(changes) => {
                setForm((current) => ({ ...current, ...changes }));
                setSelectingTcp(false);
                setFeedback(t.gripperDialog.tcpDefined);
              }}
              onImportedDimensions={(dimensions) => {
                setForm((current) => current.modelType === "IMPORTED_3D" ? {
                  ...current,
                  sizeX: dimensions.width,
                  sizeY: dimensions.depth,
                  sizeZ: dimensions.height
                } : current);
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #d7dce1" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px" }}>{t.common.cancel}</button>
          <button type="button" onClick={handleApply} style={{ padding: "10px 22px", background: "#168447", color: "#fff", border: 0, borderRadius: "6px", fontWeight: 700 }}>{t.gripperDialog.applyGripper}</button>
        </div>
      </div>
    </div>
  );
}
