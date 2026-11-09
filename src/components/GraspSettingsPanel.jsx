import NumericInput from "./NumericInput.jsx";
import { getReferencePointOptions } from "../utils/appModelUtils.js";

const sectionStyle = {
  marginTop: "12px",
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  background: "#ffffff"
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  color: "#404850",
  fontSize: "13px",
  fontWeight: 600
};

const inputStyle = {
  height: "34px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px"
};

function getGripperButtonColors(hasGripper, isVisible) {
  if (!hasGripper) {
    return { border: "1px solid #b8c0c8", background: "#eceff2", color: "#7b848d" };
  }

  return isVisible
    ? { border: "1px solid #168447", background: "#168447", color: "#ffffff" }
    : { border: "1px solid #2767c5", background: "#ffffff", color: "#2767c5" };
}

/*
  AGAFADA DEL ROBOT d'una configuració de cinta.

  Fa servir els mateixos conceptes que el TCP del palet
  (cara, face offsets i face rotation), però guardats a
  la configuració: la peça original no es modifica.
  graspFaceId és independent de la cara de contacte.
*/
export default function GraspSettingsPanel({
  piece,
  graspFaceId,
  onChange,
  hasGripper,
  isGripperVisible,
  onToggleGripper,
  t
}) {
  return (
    <section style={sectionStyle}>
      <h4
        style={{
          margin: "0 0 10px 0",
          color: "#4f5870",
          fontSize: "13px",
          fontWeight: 800,
          letterSpacing: "0.4px",
          textTransform: "uppercase"
        }}
      >
        {t.conveyor.graspTitle}
      </h4>

      <label style={labelStyle}>
        {t.conveyor.graspFace}
        <select
          value={graspFaceId ?? ""}
          onChange={(event) =>
            onChange({ graspFaceId: event.target.value || null })
          }
          style={{
            ...inputStyle,
            borderColor: graspFaceId ? "#aeb6bf" : "#c26a00"
          }}
        >
          <option value="">{t.conveyor.selectContactFace}</option>
          {/* "CENTER" és el centre de la peça, no una cara */}
          {getReferencePointOptions(piece)
            .filter((option) => option.value !== "CENTER")
            .map((option) => (
            <option key={option.value} value={option.value}>
              {t?.reference?.points?.[option.value] ?? option.label}
            </option>
          ))}
        </select>
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          marginTop: "10px"
        }}
      >
        {[
          ["faceOffsetX", t.reference.faceOffsetX],
          ["faceOffsetY", t.reference.faceOffsetY],
          ["faceRotationDeg", t.reference.faceRotation]
        ].map(([field, label]) => (
          <label key={field} style={labelStyle}>
            {label}
            <NumericInput
              value={piece[field] ?? 0}
              onChange={(value) => onChange({ [field]: Number(value) })}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      {/* Mostra la pinça creada al TCP calculat sobre la cinta */}
      <button
        type="button"
        disabled={!hasGripper}
        title={hasGripper ? undefined : t.conveyor.noGripper}
        onClick={onToggleGripper}
        style={{
          width: "100%",
          height: "34px",
          marginTop: "10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 700,
          cursor: hasGripper ? "pointer" : "not-allowed",
          ...getGripperButtonColors(hasGripper, isGripperVisible)
        }}
      >
        {isGripperVisible ? t.gripperPanel.hideGripper : t.gripperPanel.showGripper}
      </button>

      {!hasGripper && (
        <div style={{ marginTop: "6px", color: "#66717c", fontSize: "12px" }}>
          {t.conveyor.noGripper}
        </div>
      )}
    </section>
  );
}
