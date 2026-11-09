import { useState } from "react";
import NumericInput from "./NumericInput.jsx";
import {
  panelSectionStyle,
  panelInputStyle,
  panelRowStyle
} from "../styles/appStyles.js";

/*
  Resum de la selecció múltiple i moviment del
  grup per increments (Enter per aplicar).
*/
export default function MultiSelectionPanel({
  selectedCount,
  onMoveSelection,
  t
}) {
  const [groupMoveX, setGroupMoveX] = useState("");
  const [groupMoveY, setGroupMoveY] = useState("");

  function renderMoveRow(label, value, setValue, applyMove) {
    return (
      <label style={panelRowStyle}>
        {label}
        <NumericInput
          value={value}
          onChange={setValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyMove(value || 0);
              setValue("");
            }
          }}
          style={panelInputStyle}
        />
      </label>
    );
  }

  return (
    <section
      style={{
        ...panelSectionStyle,
        marginBottom: "10px"
      }}
    >
      <h4
        style={{
          margin: "0 0 8px 0",
          color: "#4f5870",
          fontSize: "14px",
          textAlign: "center"
        }}
      >
        {t.selection.multipleTitle}
      </h4>

      <div
        style={{
          padding: "8px",
          borderRadius: "5px",
          background: "#eef4fb",
          color: "#244d7c",
          fontSize: "13px",
          fontWeight: 700,
          textAlign: "center"
        }}
      >
        {selectedCount} {t.selection.selectedElements}
      </div>

      <div
        style={{
          marginTop: "8px",
          color: "#59636e",
          fontSize: "12px",
          lineHeight: 1.45
        }}
      >
        {t.selection.help}
      </div>

      <div style={{ marginTop: "10px" }}>
        <div
          style={{
            marginBottom: "8px",
            textAlign: "center",
            fontWeight: 700,
            color: "#4f5870"
          }}
        >
          {t.selection.groupMove}
        </div>

        {renderMoveRow("X", groupMoveX, setGroupMoveX, (deltaX) =>
          onMoveSelection(deltaX, 0)
        )}
        {renderMoveRow("Y", groupMoveY, setGroupMoveY, (deltaY) =>
          onMoveSelection(0, deltaY)
        )}

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "#59636e"
          }}
        >
          {t.selection.groupMoveHelp}
        </div>
      </div>
    </section>
  );
}
