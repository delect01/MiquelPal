import NumericInput from "./NumericInput.jsx";
import {
  getConveyorContactFaces,
  isValidBeltWidth,
  normalizeRotationDeg
} from "../utils/conveyorPlacement.js";
import { getImportedReferenceOptions } from "../utils/importedFaceUtils.js";

const sectionStyle = {
  marginTop: "12px",
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  background: "#ffffff"
};

const titleStyle = {
  margin: "0 0 10px 0",
  color: "#4f5870",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.4px",
  textTransform: "uppercase"
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

const smallButtonStyle = {
  height: "30px",
  padding: "0 9px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#303840",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer"
};

/*
  Etiquetes de les cares de contacte:
  - paramètriques: el nom de la cara (Centre superior...);
  - importades: número de cara + direcció aproximada.
*/
function getContactFaceOptions(piece, t) {
  const faces = getConveyorContactFaces(piece);

  if (piece.pieceType !== "IMPORTED_3D") {
    return faces.map((face) => ({
      value: face.id,
      label: t.reference.points[face.id] ?? face.id
    }));
  }

  const directionById = new Map(
    getImportedReferenceOptions(piece).map((option) => [
      option.value,
      option.label
    ])
  );

  return faces.map((face) => {
    const direction = directionById.get(face.id);

    return {
      value: face.id,
      label: direction
        ? `${t.conveyor.faceNumber(face.number)} · ${t.reference.points[direction] ?? direction}`
        : t.conveyor.faceNumber(face.number)
    };
  });
}

function formatNumber(value, decimals) {
  return Number(value).toFixed(decimals);
}

/*
  COL·LOCACIÓ SOBRE LA CINTA: cara en contacte amb la
  cinta, rotació al voltant de +Z i amplada de la cinta
  (global). La peça queda centrada automàticament al mig
  de la cinta.
*/
export default function ConveyorPlacementPanel({
  piece,
  placement,
  onChangePlacement,
  beltWidth,
  onChangeBeltWidth,
  t
}) {
  const options = getContactFaceOptions(piece, t);
  // Valor normalitzat a [0, 360) (el que es fa servir i es guarda)
  const rotation = normalizeRotationDeg(placement.rotationDeg);

  function setRotation(value) {
    onChangePlacement({ rotationDeg: normalizeRotationDeg(value) });
  }


  return (
    <section style={sectionStyle}>
      <h4 style={titleStyle}>{t.conveyor.sectionTitle}</h4>

      <label style={labelStyle}>
        {t.conveyor.contactFace}
        <select
          value={placement.contactFaceId ?? ""}
          onChange={(event) =>
            onChangePlacement({
              contactFaceId: event.target.value || null
            })
          }
          style={{
            ...inputStyle,
            borderColor: placement.contactFaceId ? "#aeb6bf" : "#c26a00"
          }}
        >
          <option value="">{t.conveyor.selectContactFace}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: "5px", color: "#66717c", fontSize: "12px" }}>
        {t.conveyor.contactFaceHelp}
      </div>

      <div style={{ ...labelStyle, marginTop: "12px" }}>
        {t.conveyor.rotation}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {/*
            Mentre s'escriu es conserva el valor tal qual (p. ex. -90);
            els càlculs i el guardat el normalitzen.
          */}
          <NumericInput
            value={placement.rotationDeg}
            onChange={(value) =>
              onChangePlacement({ rotationDeg: Number(value) })
            }
            style={{ ...inputStyle, width: "80px" }}
          />
          <span>°</span>
          {[0, 90, 180, 270].map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setRotation(angle)}
              style={{
                ...smallButtonStyle,
                borderColor: rotation === angle ? "#2767c5" : "#aeb6bf",
                background: rotation === angle ? "#eef4fb" : "#ffffff",
                color: rotation === angle ? "#2767c5" : "#303840"
              }}
            >
              {angle}°
            </button>
          ))}
        </div>
      </div>

      {/* Amplada de la cinta (global): la peça queda centrada al mig */}
      <div style={{ ...labelStyle, marginTop: "12px" }}>
        {t.conveyor.beltWidth}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <NumericInput
            value={beltWidth}
            onChange={(value) => onChangeBeltWidth(Number(value))}
            aria-label={t.conveyor.beltWidth}
            style={{
              ...inputStyle,
              width: "100px",
              borderColor: isValidBeltWidth(beltWidth) ? "#aeb6bf" : "#c26a00"
            }}
          />
          <span>mm</span>
        </div>
      </div>

      <div style={{ marginTop: "5px", color: "#66717c", fontSize: "12px" }}>
        {t.conveyor.beltWidthHelp}
      </div>
    </section>
  );
}

/*
  TCP RESPECTE DEL FRAME DE LA CINTA (només lectura).

  statusKey: valid, incomplete, needsReview,
  geometryChanged o error.
*/
export function ConveyorTcpSummary({
  statusKey,
  reasonText,
  tcpPose,
  t
}) {
  const statusStyles = {
    valid: { background: "#eef9f2", color: "#168447", text: t.conveyor.tcpValid },
    incomplete: { background: "#fff4e5", color: "#8a4b00", text: t.conveyor.tcpIncomplete },
    needsReview: { background: "#fff0f1", color: "#b02a37", text: t.conveyor.tcpNeedsReview },
    geometryChanged: { background: "#fff0f1", color: "#b02a37", text: t.conveyor.tcpGeometryChanged },
    error: { background: "#fff0f1", color: "#b02a37", text: t.conveyor.tcpError }
  };

  const statusStyle = statusStyles[statusKey] ?? statusStyles.error;

  const rows = tcpPose.valid
    ? [
        ["X", `${formatNumber(tcpPose.position.x, 3)} mm`],
        ["Y", `${formatNumber(tcpPose.position.y, 3)} mm`],
        ["Z", `${formatNumber(tcpPose.position.z, 3)} mm`],
        ["RX", `${formatNumber(tcpPose.euler.x, 2)}°`],
        ["RY", `${formatNumber(tcpPose.euler.y, 2)}°`],
        ["RZ", `${formatNumber(tcpPose.euler.z, 2)}°`]
      ]
    : [];

  return (
    <section style={sectionStyle}>
      <h4 style={titleStyle}>{t.conveyor.tcpTitle}</h4>

      <div style={{ marginBottom: "8px", color: "#4f5870", fontSize: "12px", fontWeight: 700 }}>
        {t.conveyor.frameZUp}
      </div>

      <div
        style={{
          padding: "7px 9px",
          borderRadius: "5px",
          background: statusStyle.background,
          color: statusStyle.color,
          fontSize: "12px",
          fontWeight: 700
        }}
      >
        {statusStyle.text}
        {reasonText && <span style={{ fontWeight: 600 }}> · {reasonText}</span>}
      </div>

      {tcpPose.valid && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "6px",
              marginTop: "9px"
            }}
          >
            {rows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "6px 8px",
                  borderRadius: "5px",
                  background: "#eef1f4",
                  fontSize: "12px"
                }}
              >
                <div style={{ color: "#66717c", fontWeight: 700 }}>{label}</div>
                <div style={{ color: "#20262c", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "7px", color: "#66717c", fontSize: "12px" }}>
            {t.conveyor.orientationConvention}
          </div>
        </>
      )}

    </section>
  );
}
