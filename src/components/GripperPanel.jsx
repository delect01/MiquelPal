import {
  panelSectionStyle,
  panelTitleStyle
} from "../styles/appStyles.js";

function getVisibilityButtonColors(hasGripper, isVisible) {
  if (!hasGripper) {
    return {
      border: "1px solid #b8c0c8",
      background: "#eceff2",
      color: "#7b848d"
    };
  }

  return isVisible
    ? {
        border: "1px solid #168447",
        background: "#168447",
        color: "#ffffff"
      }
    : {
        border: "1px solid #2767c5",
        background: "#ffffff",
        color: "#2767c5"
      };
}

/*
  Configurador de pinça: crear-ne una de nova i
  mostrar-la o amagar-la a l'escena.
*/
export default function GripperPanel({
  activeGripper,
  isGripperVisible,
  onNewGripper,
  onToggleGripperVisible,
  t
}) {
  const hasGripper = Boolean(activeGripper);

  return (
    <section
      data-gripper-configurator-panel="true"
      style={{
        ...panelSectionStyle,
        marginBottom: "10px"
      }}
    >
      <h4 style={panelTitleStyle}>{t.gripperPanel.title}</h4>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={onNewGripper}
          style={{
            flex: 1,
            padding: "10px 7px",
            border: "1px solid #2767c5",
            borderRadius: "6px",
            background: "#2767c5",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {t.gripperPanel.newGripper}
        </button>

        <button
          type="button"
          disabled={!hasGripper}
          onClick={onToggleGripperVisible}
          style={{
            flex: 1,
            padding: "10px 7px",
            borderRadius: "6px",
            fontWeight: 700,
            cursor: hasGripper ? "pointer" : "not-allowed",
            ...getVisibilityButtonColors(
              hasGripper,
              isGripperVisible
            )
          }}
        >
          {isGripperVisible
            ? t.gripperPanel.hideGripper
            : t.gripperPanel.showGripper}
        </button>
      </div>
    </section>
  );
}
