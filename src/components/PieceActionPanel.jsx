import { useState } from "react";
import NumericInput from "./NumericInput.jsx";
import {
  panelButtonStyle,
  panelInputStyle,
  panelSectionStyle
} from "../styles/appStyles.js";

function getActionButtonStyle(canAct, color = "#303840", borderColor = "#aeb6bf") {
  return {
    ...panelButtonStyle,
    border: `1px solid ${canAct ? borderColor : "#c5cbd1"}`,
    background: canAct ? "#ffffff" : "#eceff2",
    color: canAct ? color : "#7b848d",
    opacity: canAct ? 1 : 0.65,
    cursor: canAct ? "pointer" : "not-allowed"
  };
}

/*
  Accions del configurador de peces o separadors:
  - a dalt, sota el títol, el botó gran de crear;
  - a sota: Editar, Duplicar (amb
    desplegable per a la distància entre còpies) i
    Eliminar.

  La distància de duplicació (X i Y del palet, mm; 0 =
  enganxades) s'aplica al botó Duplicar i a la rèplica
  amb Ctrl + arrossegar.
*/
export default function PieceActionPanel({
  type,
  canAct,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  duplicateSpacing = { x: 0, y: 0 },
  onChangeDuplicateSpacing,
  t
}) {
  const [showSpacing, setShowSpacing] = useState(false);

  const isSeparator =
    type === "separator";

  const title = isSeparator
    ? t.separators.title
    : t.pieces.title;

  const createLabel = isSeparator
    ? t.separators.new
    : t.pieces.new;

  function updateSpacing(axis, value) {
    onChangeDuplicateSpacing?.({
      ...duplicateSpacing,
      [axis]: Number(value)
    });
  }

  return (
    <section
      style={{
        ...panelSectionStyle,
        marginBottom: "12px"
      }}
    >
      <h4
        style={{
          margin: "0 0 9px 0",
          color: "#4f5870",
          fontSize: "14px",
          textAlign: "center"
        }}
      >
        {title}
      </h4>

      {/* Crear: just sota el títol, a tota l'amplada */}
      <button
        type="button"
        onClick={onCreate}
        style={{
          ...panelButtonStyle,
          width: "100%",
          height: "38px",
          marginBottom: "8px",
          border: "1px solid #2767c5",
          background: "#2767c5",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 700
        }}
      >
        {createLabel}
      </button>

      <div
        style={{
          display: "flex",
          gap: "6px"
        }}
      >
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={!canAct}
            style={getActionButtonStyle(canAct)}
          >
            {t.pieces.edit}
          </button>
        )}

        {/* Duplicar + desplegable de la distància entre còpies */}
        {/* Una mica més ample: hi cap també el botó del desplegable */}
        <div style={{ flex: "1.4 1 0", minWidth: 0, display: "flex" }}>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canAct}
            style={{
              ...getActionButtonStyle(canAct),
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0
            }}
          >
            {t.pieces.duplicate}
          </button>
          <button
            type="button"
            onClick={() => setShowSpacing((value) => !value)}
            aria-expanded={showSpacing}
            aria-label={t.pieces.duplicateSpacing}
            title={t.pieces.duplicateSpacing}
            style={{
              ...panelButtonStyle,
              flex: "0 0 auto",
              width: "24px",
              padding: 0,
              marginLeft: "-1px",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              background: showSpacing ? "#eef4fb" : "#ffffff",
              color: showSpacing ? "#2767c5" : "#303840"
            }}
          >
            {showSpacing ? "▴" : "▾"}
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canAct}
          style={getActionButtonStyle(canAct, "#b02a37", "#b02a37")}
        >
          {t.pieces.delete}
        </button>
      </div>

      {showSpacing && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            border: "1px solid #d7dce1",
            borderRadius: "6px",
            background: "#f7f8fa"
          }}
        >
          <div
            style={{
              marginBottom: "6px",
              color: "#4f5870",
              fontSize: "12px",
              fontWeight: 700,
              textAlign: "center"
            }}
          >
            {t.pieces.duplicateSpacing}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["x", "y"].map((axis) => (
              <label
                key={axis}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#404850",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              >
                {axis.toUpperCase()}
                <NumericInput
                  value={duplicateSpacing[axis]}
                  onChange={(value) => updateSpacing(axis, value)}
                  aria-label={`${t.pieces.duplicateSpacing} ${axis.toUpperCase()}`}
                  style={panelInputStyle}
                />
                <span style={{ color: "#66717c", fontWeight: 500 }}>mm</span>
              </label>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
