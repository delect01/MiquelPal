import { useEffect, useState } from "react";
import * as THREE from "three";
import GripperPreview from "./GripperPreview.jsx";
import Import3DButton from "./Import3DButton.jsx";
import NumericInput from "./NumericInput.jsx";
import { loadStoredModel } from "../utils/modelLoader.js";
import { computeAutoGripZone } from "../utils/graspGeometry.js";
import { preserveUnreadableStorageList } from "../utils/projectStorage.js";

const STORAGE_KEY = "pallet-simulator-gripper-library";

const defaultTcpPosition = () => ({ x: 0, y: 0, z: 0 });
const defaultTcpQuaternion = () => ({ x: 0, y: 0, z: 0, w: 1 });
const defaultTcpRotation = () => ({ rxDeg: 0, ryDeg: 0, rzDeg: 0 });

const sectionStyle = {
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  marginBottom: "10px",
  background: "#ffffff"
};

const sectionTitleStyle = { margin: "0 0 10px", fontSize: "17px" };

const inputStyle = {
  width: "100%",
  height: "34px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px"
};

const errorBoxStyle = {
  marginTop: "10px",
  padding: "8px 10px",
  borderRadius: "5px",
  background: "#fff0f1",
  color: "#b02a37",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.4
};

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
  // Una biblioteca illegible es conserva abans de sobreescriure-la
  if (!preserveUnreadableStorageList(STORAGE_KEY)) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("No s'ha pogut guardar la biblioteca de grippers:", error);
    return false;
  }
}

function isImportedGripper(gripper) {
  return gripper?.modelType === "IMPORTED_3D" && Boolean(gripper?.modelId);
}

// Els valors del TCP es mostren i es desen amb 3 decimals
function roundTo3(value) {
  return Math.round(Number(value) * 1000) / 1000 || 0;
}

function rotationToQuaternion(rotation) {
  const quaternion = new THREE.Quaternion()
    .setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(rotation.rxDeg),
        THREE.MathUtils.degToRad(rotation.ryDeg),
        THREE.MathUtils.degToRad(rotation.rzDeg),
        "XYZ"
      )
    )
    .normalize();

  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

function quaternionToRotationDeg(quaternion) {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");

  return {
    rxDeg: roundTo3(THREE.MathUtils.radToDeg(euler.x)),
    ryDeg: roundTo3(THREE.MathUtils.radToDeg(euler.y)),
    rzDeg: roundTo3(THREE.MathUtils.radToDeg(euler.z))
  };
}

/*
  TCP triat clicant el model: posició i rotació a 3
  decimals, i el quaternion recalculat a partir dels
  angles arrodonits (el que es veu és el que s'aplica).
*/
function roundTcp(changes) {
  const tcpRotation = {
    rxDeg: roundTo3(changes.tcpRotation.rxDeg),
    ryDeg: roundTo3(changes.tcpRotation.ryDeg),
    rzDeg: roundTo3(changes.tcpRotation.rzDeg)
  };

  return {
    ...changes,
    tcpPosition: {
      x: roundTo3(changes.tcpPosition.x),
      y: roundTo3(changes.tcpPosition.y),
      z: roundTo3(changes.tcpPosition.z)
    },
    tcpRotation,
    tcpQuaternion: rotationToQuaternion(tcpRotation)
  };
}

/*
  En una pinça importada, la seva orientació la defineix
  només el TCP local. Desplaçar X/Y no s'hi aplica i el
  "Robot Front" és un gir al voltant de la Z de l'eina,
  el mateix que pot fer la rotació del TCP. Si una pinça
  importada desada en tenia, el gir s'incorpora al TCP
  (la pinça es veu igual) i aquests camps queden a 0.

  A l'escena: model = destí · Rz(front) · TCP⁻¹
                    = destí · (TCP · Rz(-front))⁻¹
*/
function withoutBoxOnlyFields(gripper) {
  const robotFrontDeg = Number(gripper.robotFrontDeg) || 0;

  if (!robotFrontDeg) {
    return { ...gripper, offsetX: 0, offsetY: 0, robotFrontDeg: 0 };
  }

  const tcpQuaternion = new THREE.Quaternion(
    Number(gripper.tcpQuaternion.x) || 0,
    Number(gripper.tcpQuaternion.y) || 0,
    Number(gripper.tcpQuaternion.z) || 0,
    Number.isFinite(Number(gripper.tcpQuaternion.w)) ? Number(gripper.tcpQuaternion.w) : 1
  )
    .normalize()
    .multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(-robotFrontDeg)
      )
    )
    .normalize();

  return {
    ...gripper,
    offsetX: 0,
    offsetY: 0,
    robotFrontDeg: 0,
    tcpQuaternion: {
      x: tcpQuaternion.x,
      y: tcpQuaternion.y,
      z: tcpQuaternion.z,
      w: tcpQuaternion.w
    },
    tcpRotation: quaternionToRotationDeg(tcpQuaternion)
  };
}

function createForm(gripper) {
  const form = {
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
    tcpRotation: { ...defaultTcpRotation(), ...gripper?.tcpRotation },
    /*
      Zona d'agafada de la pinça importada (agafades
      múltiples), en els eixos del TCP. Automàtica fins
      que se n'edita algun valor.
    */
    activeZone: {
      sizeX: 0,
      sizeY: 0,
      centerX: 0,
      centerY: 0,
      ...gripper?.activeZone,
      auto:
        gripper?.activeZone?.auto ??
        !(Number(gripper?.activeZone?.sizeX) > 0 && Number(gripper?.activeZone?.sizeY) > 0)
    }
  };

  return isImportedGripper(form) ? withoutBoxOnlyFields(form) : form;
}

function NumericField({ label, value, onChange, unit }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "5px", color: "#404850", fontSize: "12px", fontWeight: 600 }}>
      {label}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <NumericInput
          step={0.1}
          value={value}
          onChange={onChange}
          aria-label={label}
          style={inputStyle}
        />
        {unit && <span style={{ color: "#66717c", fontSize: "11px" }}>{unit}</span>}
      </div>
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

  /*
    Zona d'agafada automàtica: centrada al TCP i amb la
    llargada màxima de la pinça en X i Y del TCP. Es
    recalcula en canviar el model o el TCP.
  */
  const zoneModelId = form.modelType === "IMPORTED_3D" ? form.modelId : null;
  const zoneBottomFace = form.modelBottomFace;
  const isZoneAuto = Boolean(form.activeZone?.auto);
  const zoneTcpKey = JSON.stringify([form.tcpPosition, form.tcpQuaternion]);

  useEffect(() => {
    if (!open || !zoneModelId || !isZoneAuto) return;

    let active = true;
    const [tcpPosition, tcpQuaternion] = JSON.parse(zoneTcpKey);

    loadStoredModel(zoneModelId, zoneBottomFace || "NEGATIVE_Y")
      .then((result) => {
        const zone = computeAutoGripZone(result.object, tcpPosition, tcpQuaternion);
        if (!active || !zone) return;

        setForm((current) =>
          current.modelId === zoneModelId && current.activeZone?.auto
            ? { ...current, activeZone: { ...zone, auto: true } }
            : current
        );
      })
      .catch((error) => console.error("No s'ha pogut calcular la zona d'agafada:", error));

    return () => {
      active = false;
    };
  }, [open, zoneModelId, zoneBottomFace, isZoneAuto, zoneTcpKey]);

  if (!open) return null;

  const imported = isImportedGripper(form);

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

  function updateActiveZone(field, value) {
    setForm((current) => ({
      ...current,
      // Editar-la a mà deixa d'actualitzar-la automàticament
      activeZone: { ...current.activeZone, [field]: Number(value) || 0, auto: false }
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
      // Desplaçar X/Y i Robot Front només s'apliquen a la pinça creada (capsa)
      offsetX: imported ? 0 : Number(form.offsetX),
      offsetY: imported ? 0 : Number(form.offsetY),
      robotFrontDeg: imported ? 0 : Number(form.robotFrontDeg),
      // La pinça de capsa fa servir la seva cara inferior
      activeZone: imported
        ? {
            sizeX: Math.max(Number(form.activeZone?.sizeX) || 0, 0),
            sizeY: Math.max(Number(form.activeZone?.sizeY) || 0, 0),
            centerX: Number(form.activeZone?.centerX) || 0,
            centerY: Number(form.activeZone?.centerY) || 0,
            auto: Boolean(form.activeZone?.auto)
          }
        : null
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
    setFeedback("");
  }

  function handleApply() {
    const data = validatedData();
    if (!data) return;
    onApplyGripper({ ...data, id: selectedId || activeGripper?.id || "active-gripper" });
    onClose();
  }

  function deleteSelected() {
    const next = library.filter((item) => item.id !== selectedId);
    if (saveLibrary(next)) {
      setLibrary(next);
      setSelectedId("");
      setForm(createForm(null));
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={t.gripperDialog.title} style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(20,25,30,0.72)" }}>
      <div style={{ width: "min(1080px,96vw)", maxHeight: "94vh", display: "flex", flexDirection: "column", borderRadius: "10px", background: "#fff", overflow: "hidden" }}>
        {/* Capçalera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1px solid #d7dce1" }}>
          <div style={{ textAlign: "start" }}>
            <h2 style={{ margin: 0 }}>{t.gripperDialog.title}</h2>
            <div style={{ marginTop: "4px", color: "#59636e", fontSize: "13px" }}>{t.gripperDialog.subtitle}</div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.palletDialog.close} style={{ width: "38px", height: "38px", flex: "0 0 auto", borderRadius: "50%" }}>×</button>
        </div>

        {/* Cos: controls (esquerra) i previsualització (dreta) */}
        {/*
          Pantalla ampla: només la columna esquerra es
          desplaça; la previsualització 3D queda fixa.
          Pantalla estreta (columnes una sota l'altra):
          es desplaça tot.
        */}
        <style>{`
          .gripper-dialog-body { overflow-y: auto; flex-wrap: wrap; align-items: flex-start; }
          @media (min-width: 860px) {
            .gripper-dialog-body { overflow: hidden; flex-wrap: nowrap; align-items: stretch; }
            .gripper-dialog-left { overflow-y: auto; padding-right: 6px; }
          }
        `}</style>
        <div className="gripper-dialog-body" style={{ flex: 1, minHeight: 0, padding: "14px 16px", display: "flex", gap: "16px" }}>
          <div className="gripper-dialog-left" style={{ flex: "1 1 320px", maxWidth: "400px", minWidth: 0, minHeight: 0 }}>
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>{t.gripperDialog.library}</h3>
              <select
                value={selectedId}
                aria-label={t.gripperDialog.library}
                onChange={(event) => {
                  const id = event.target.value;
                  setSelectedId(id);
                  const selected = library.find((item) => item.id === id);
                  if (selected) setForm(createForm(selected));
                }}
                style={{ ...inputStyle, height: "36px" }}
              >
                <option value="" disabled>{t.gripperDialog.list}</option>
                {[...library].sort((a, b) => a.name.localeCompare(b.name, "ca")).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={deleteSelected}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid #b02a37",
                    borderRadius: "5px",
                    background: selectedId ? "#ffffff" : "#eceff2",
                    color: selectedId ? "#b02a37" : "#7b848d",
                    cursor: selectedId ? "pointer" : "not-allowed"
                  }}
                >
                  {t.gripperDialog.deleteGripper}
                </button>
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
                    // Només per a la pinça creada (capsa)
                    offsetX: 0,
                    offsetY: 0,
                    robotFrontDeg: 0,
                    tcpDefined: false,
                    tcpPosition: defaultTcpPosition(),
                    tcpQuaternion: defaultTcpQuaternion(),
                    tcpRotation: defaultTcpRotation()
                  }));
                  setSelectedId("");
                  setSelectingTcp(true);
                  setFeedback("");
                }} />
              </div>
            </section>

            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>{t.gripperDialog.characteristics}</h3>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontWeight: 600 }}>
                {t.common.name}
                <input value={form.name} onChange={(event) => update("name", event.target.value)} style={inputStyle} />
              </label>

              {!imported && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "8px", marginTop: "12px" }}>
                    <NumericField label={t.gripperDialog.sizeX} value={form.sizeX} onChange={(value) => update("sizeX", value)} />
                    <NumericField label={t.gripperDialog.sizeY} value={form.sizeY} onChange={(value) => update("sizeY", value)} />
                    <NumericField label={t.gripperDialog.sizeZ} value={form.sizeZ} onChange={(value) => update("sizeZ", value)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "8px", marginTop: "10px" }}>
                    <NumericField label={t.gripperDialog.offsetX} value={form.offsetX} onChange={(value) => update("offsetX", value)} />
                    <NumericField label={t.gripperDialog.offsetY} value={form.offsetY} onChange={(value) => update("offsetY", value)} />
                    <NumericField label={t.gripperDialog.robotFront} value={form.robotFrontDeg} onChange={(value) => update("robotFrontDeg", value)} />
                  </div>
                </>
              )}
            </section>

            {imported && (
              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>{t.gripperDialog.localTcp}</h3>
                <button
                  type="button"
                  onClick={() => setSelectingTcp((value) => !value)}
                  aria-pressed={selectingTcp}
                  style={{ width: "100%", padding: "9px", background: selectingTcp ? "#168447" : "#fff", color: selectingTcp ? "#fff" : "#168447", border: "1px solid #168447", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  {selectingTcp ? t.gripperDialog.selectingTcp : t.gripperDialog.selectTcp}
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "8px", marginTop: "10px" }}>
                  {(["x", "y", "z"]).map((axis) => <NumericField key={axis} label={`${t.gripperDialog.position} ${axis.toUpperCase()}`} unit="mm" value={form.tcpPosition[axis]} onChange={(value) => updateTcpPosition(axis, value)} />)}
                  <NumericField label="RX" unit="°" value={form.tcpRotation.rxDeg} onChange={(value) => updateTcpRotation("rxDeg", value)} />
                  <NumericField label="RY" unit="°" value={form.tcpRotation.ryDeg} onChange={(value) => updateTcpRotation("ryDeg", value)} />
                  <NumericField label="RZ" unit="°" value={form.tcpRotation.rzDeg} onChange={(value) => updateTcpRotation("rzDeg", value)} />
                </div>
              </section>
            )}

            {imported && (
              <section style={sectionStyle} data-active-zone="true">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                  <h3 style={{ ...sectionTitleStyle, margin: 0, color: "#7c3aed" }}>{t.gripperDialog.activeZone}</h3>
                  <button
                    type="button"
                    aria-pressed={isZoneAuto}
                    onClick={() => setForm((current) => ({ ...current, activeZone: { ...current.activeZone, auto: true } }))}
                    style={{ padding: "5px 10px", border: "1px solid #7c3aed", borderRadius: "6px", background: isZoneAuto ? "#7c3aed" : "#ffffff", color: isZoneAuto ? "#ffffff" : "#7c3aed", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {t.gripperDialog.zoneAuto}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "8px" }}>
                  <NumericField label={t.gripperDialog.zoneSizeX} unit="mm" value={form.activeZone.sizeX} onChange={(value) => updateActiveZone("sizeX", value)} />
                  <NumericField label={t.gripperDialog.zoneSizeY} unit="mm" value={form.activeZone.sizeY} onChange={(value) => updateActiveZone("sizeY", value)} />
                  <NumericField label={t.gripperDialog.zoneCenterX} unit="mm" value={form.activeZone.centerX} onChange={(value) => updateActiveZone("centerX", value)} />
                  <NumericField label={t.gripperDialog.zoneCenterY} unit="mm" value={form.activeZone.centerY} onChange={(value) => updateActiveZone("centerY", value)} />
                </div>
              </section>
            )}

            <button type="button" onClick={handleSave} style={{ width: "100%", padding: "10px", background: "#2767c5", color: "#fff", border: 0, borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>{t.gripperDialog.saveCharacteristics}</button>
            {/* Només es mostren els errors de validació */}
            {feedback && <div role="alert" style={errorBoxStyle}>{feedback}</div>}
          </div>

          <div style={{ flex: "2 1 420px", minWidth: 0 }}>
            <h3 style={{ ...sectionTitleStyle, textAlign: "center" }}>{t.gripperDialog.preview3D}</h3>
            <GripperPreview
              gripper={form}
              selectingTcp={selectingTcp}
              onTcpSelected={(changes) => {
                setForm((current) => ({ ...current, ...roundTcp(changes) }));
                setSelectingTcp(false);
                setFeedback("");
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

        {/* Peu */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "12px 16px", borderTop: "1px solid #d7dce1" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px" }}>{t.common.cancel}</button>
          <button type="button" onClick={handleApply} style={{ padding: "10px 22px", background: "#168447", color: "#fff", border: 0, borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>{t.gripperDialog.applyGripper}</button>
        </div>
      </div>
    </div>
  );
}
