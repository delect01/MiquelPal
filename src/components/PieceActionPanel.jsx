import {
  panelButtonStyle,
  panelSectionStyle
} from "../styles/appStyles.js";

export default function PieceActionPanel({
  type,
  canAct,
  onCreate,
  onDuplicate,
  onDelete,
  t
}) {
  const isSeparator =
    type === "separator";

  const title = isSeparator
    ? t.separators.title
    : t.pieces.title;

  const createLabel = isSeparator
    ? t.separators.new
    : t.pieces.new;

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

      <div
        style={{
          display: "flex",
          gap: "6px"
        }}
      >
        <button
          type="button"
          onClick={onCreate}
          style={{
            ...panelButtonStyle,
            borderColor: "#2767c5",
            background: "#2767c5",
            color: "#ffffff"
          }}
        >
          {createLabel}
        </button>

        <button
          type="button"
          onClick={onDuplicate}
          disabled={!canAct}
          style={{
            ...panelButtonStyle,
            background: canAct
              ? "#ffffff"
              : "#eceff2",
            color: canAct
              ? "#303840"
              : "#7b848d",
            opacity: canAct ? 1 : 0.65,
            cursor: canAct
              ? "pointer"
              : "not-allowed"
          }}
        >
          {t.pieces.duplicate}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canAct}
          style={{
            ...panelButtonStyle,
            borderColor: canAct
              ? "#b02a37"
              : "#c5cbd1",
            background: canAct
              ? "#ffffff"
              : "#eceff2",
            color: canAct
              ? "#b02a37"
              : "#7b848d",
            opacity: canAct ? 1 : 0.65,
            cursor: canAct
              ? "pointer"
              : "not-allowed"
          }}
        >
          {t.pieces.delete}
        </button>
      </div>
    </section>
  );
}
