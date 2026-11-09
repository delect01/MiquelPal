import { useState } from "react";
import NumericInput from "./NumericInput.jsx";
import {
  panelSectionStyle,
  panelTitleStyle,
  panelInputStyle,
  readOnlyInputStyle,
  panelRowStyle
} from "../styles/appStyles.js";
import { roundToThreeDecimals } from "../utils/appModelUtils.js";
import {
  getDisplayedCoordinates,
  displayedToCenterCoordinates,
  getReferenceRobotEuler
} from "../utils/pieceUtils.js";

const sectionStyle = {
  ...panelSectionStyle,
  marginBottom: "10px"
};

const lastRowStyle = {
  ...panelRowStyle,
  marginBottom: 0
};

/*
  Dades de la peça o separador seleccionat: posició i,
  dins "Opcions avançades", l'orientació de referència.
  El TCP del robot de les peces es defineix al
  Configurador de cinta; els separadors el mostren aquí.
*/
export default function SelectedPiecePanel({
  piece,
  isSeparator,
  setPieces,
  t
}) {
  const displayed = getDisplayedCoordinates(piece);
  const referenceEuler = getReferenceRobotEuler(piece);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateSelectedPiece(changes) {
    setPieces((currentPieces) =>
      currentPieces.map((currentPiece) =>
        currentPiece.id === piece.id
          ? { ...currentPiece, ...changes }
          : currentPiece
      )
    );
  }

  function updatePieceField(field, value) {
    if (value === "") return;

    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) return;

    updateSelectedPiece({ [field]: numericValue });
  }

  /*
    X/Y/Z es mostren respecte al punt de referència;
    la peça es guarda pel seu centre.
  */
  function updateDisplayedCoordinate(axis, displayedValue) {
    if (displayedValue === "") return;

    const numericValue = parseFloat(displayedValue);

    if (isNaN(numericValue)) return;

    const converted = displayedToCenterCoordinates(
      piece,
      axis === "x" ? numericValue : displayed.x,
      axis === "y" ? numericValue : displayed.y,
      axis === "z" ? numericValue : displayed.z
    );

    updateSelectedPiece({
      x: roundToThreeDecimals(converted.x),
      y: roundToThreeDecimals(converted.y),
      z: roundToThreeDecimals(converted.z)
    });
  }

  function renderNumberRow(label, value, onChange, style) {
    return (
      <label style={style ?? panelRowStyle}>
        <span>{label}</span>
        <NumericInput
          value={value}
          onChange={onChange}
          style={panelInputStyle}
        />
      </label>
    );
  }

  function renderPositionRow(axis, label, style) {
    return renderNumberRow(
      label,
      roundToThreeDecimals(displayed[axis]),
      (value) => updateDisplayedCoordinate(axis, value),
      style
    );
  }

  function renderRotationRow(field, label, style) {
    return renderNumberRow(
      label,
      piece[field],
      (value) => updatePieceField(field, value),
      style
    );
  }

  function renderReadOnlyRow(label, value, style) {
    return (
      <label style={style ?? panelRowStyle}>
        {label}
        <input
          value={value.toFixed(2)}
          readOnly
          style={readOnlyInputStyle}
        />
      </label>
    );
  }

  return (
    <>
      <h3
        style={{
          margin: "2px 0 12px 0",
          textAlign: "center",
          color: "#4f5870",
          fontSize: "17px",
          fontWeight: 700,
          letterSpacing: "0.4px"
        }}
      >
        {isSeparator ? t.separators.selected : t.pieces.selected}
      </h3>

      <section style={{ ...sectionStyle, textAlign: "center" }}>
        <div style={{ fontSize: "13px", marginBottom: "4px" }}>
          <strong>{t.common.id}:</strong> {piece.orderId}
        </div>

        <div style={{ fontSize: "13px", marginBottom: "4px" }}>
          <strong>{t.common.name}:</strong>{" "}
          {piece.name ??
            (isSeparator
              ? `Separador ${piece.id}`
              : `Peça ${piece.id}`)}
        </div>
      </section>

      {/*
        A les peces, el TCP del robot ja no s'edita aquí: el
        defineix l'agafada del Configurador de cinta. Els
        separadors el mantenen (TCP fix a TOP_CENTER).
      */}
      {isSeparator && (
        <section style={sectionStyle}>
          <h4 style={panelTitleStyle}>{t.reference.robotTcp}</h4>

          <div
            style={{
              marginBottom: "9px",
              padding: "7px",
              borderRadius: "5px",
              background: "#eef1f4",
              color: "#34404b",
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center"
            }}
          >
            TOP_CENTER
          </div>

          {renderNumberRow(
            t.reference.faceOffsetX,
            piece.faceOffsetX,
            (value) => updatePieceField("faceOffsetX", value)
          )}
          {renderNumberRow(
            t.reference.faceOffsetY,
            piece.faceOffsetY,
            (value) => updatePieceField("faceOffsetY", value)
          )}
          {renderNumberRow(
            t.reference.faceRotation,
            piece.faceRotationDeg,
            (value) => updatePieceField("faceRotationDeg", value)
          )}
        </section>
      )}

      <section style={sectionStyle}>
        <h4 style={panelTitleStyle}>
          {isSeparator ? t.separators.position : t.pieces.position}
        </h4>

        {renderPositionRow("x", "X")}
        {renderPositionRow("y", "Y")}
        {renderPositionRow("z", "Z")}
        {renderRotationRow("rxDeg", "RX")}
        {renderRotationRow("ryDeg", "RY")}
        {renderRotationRow("rzDeg", "RZ", lastRowStyle)}
      </section>

      {/* Orientació de referència: dins "Opcions avançades" (tancat per defecte) */}
      <section style={panelSectionStyle}>
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          aria-expanded={showAdvanced}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 0,
            border: 0,
            background: "transparent",
            color: "#4f5870",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          {t.reference.advancedOptions}
          <span aria-hidden="true">{showAdvanced ? "▾" : "▸"}</span>
        </button>

        {showAdvanced && (
          <div style={{ marginTop: "10px" }}>
            <h4 style={panelTitleStyle}>{t.reference.orientation}</h4>

            {renderReadOnlyRow("Ref RX", referenceEuler.rx)}
            {renderReadOnlyRow("Ref RY", referenceEuler.ry)}
            {renderReadOnlyRow("Ref RZ", referenceEuler.rz, lastRowStyle)}
          </div>
        )}
      </section>
    </>
  );
}
