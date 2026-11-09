import NumericInput from "./NumericInput.jsx";
import SimulateButton from "./SimulateButton.jsx";
const EMPTY_OFFSETS = {
  approach: { x: 0, y: 0, z: 0 },
  retreat: { x: 0, y: 0, z: 0 }
};

function OffsetFields({
  title,
  values,
  active,
  onTitleClick,
  onChange,
  simulation
}) {
  const inputStyle = {
    width: "100%",
    height: "31px",
    boxSizing: "border-box",
    padding: "0 6px",
    border: "1px solid #aeb6bf",
    borderRadius: "5px",
    fontSize: "12px"
  };

  return (
    <div
      style={{
        marginTop: "9px",
        padding: "9px",
        border: active
          ? "1px solid #168447"
          : "1px solid #d7dce1",
        borderRadius: "6px",
        background: active
          ? "#eef9f2"
          : "#ffffff"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <button
          type="button"
          onClick={onTitleClick}
          style={{
            flex: 1,
            padding: 0,
            border: 0,
            background: "transparent",
            color: active
              ? "#168447"
              : "#4f5870",
            fontSize: "12px",
            fontWeight: 700,
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          {title}
        </button>

        {simulation && <SimulateButton {...simulation} />}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "7px",
          marginTop: "8px"
        }}
      >
        {["x", "y", "z"].map((axis) => (
          <label
            key={axis}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              color: "#59636e",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase"
            }}
          >
            {axis}
            <NumericInput
              value={values?.[axis] ?? 0}
              onChange={(value) => {
                onChange(axis, value);
              }}
              style={inputStyle}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function GripperOffsetsPanel({
  selectedPiece,
  genericOffsets = EMPTY_OFFSETS,
  previewMode,
  onPreviewModeChange,
  onChangeGenericOffset,
  onChangePieceOffset,
  onUseGenericOffsets,
  hasGripper = false,
  simulationMode = null,
  simulationSpeed = 1,
  onSimulate,
  t
}) {
  const hasCustomOffsets =
    Boolean(selectedPiece?.gripperOffsets);

  const editingPiece =
    Boolean(selectedPiece);

  const effectiveOffsets =
    selectedPiece?.gripperOffsets ??
    genericOffsets ??
    EMPTY_OFFSETS;

  function changeOffset(
    offsetType,
    axis,
    value
  ) {
    if (editingPiece) {
      onChangePieceOffset(
        selectedPiece.id,
        offsetType,
        axis,
        value
      );
      return;
    }

    onChangeGenericOffset(
      offsetType,
      axis,
      value
    );
  }

  /*
    La simulació necessita una peça seleccionada;
    sense pinça el botó queda desactivat.
  */
  function getSimulation(mode, title) {
    if (!editingPiece || !onSimulate) {
      return null;
    }

    return {
      running: simulationMode === mode,
      disabled: !hasGripper,
      title: hasGripper
        ? title
        : t.gripperOffsets.simulationNeedsGripper,
      onClick: () => onSimulate(mode)
    };
  }

  function togglePreview(mode) {
    onPreviewModeChange(
      previewMode === mode
        ? null
        : mode
    );
  }

  return (
    <div
      style={{
        marginTop: "9px",
        padding: "10px",
        border: "1px solid #c9d0d7",
        borderRadius: "7px",
        background: "#f8fafc"
      }}
    >
      <div
        style={{
          color: "#4f5870",
          fontSize: "13px",
          fontWeight: 800,
          textAlign: "center"
        }}
      >
        {editingPiece
          ? t.gripperOffsets.piece(selectedPiece.orderId ?? selectedPiece.id)
          : t.gripperOffsets.generic}
      </div>

      {editingPiece && (
        <div
          style={{
            marginTop: "5px",
            color: "#66717c",
            fontSize: "11px",
            textAlign: "center"
          }}
        >
          {hasCustomOffsets
            ? t.gripperOffsets.custom
            : t.gripperOffsets.inherited}
        </div>
      )}

      {simulationMode && (
        <div
          style={{
            marginTop: "7px",
            padding: "6px 8px",
            borderRadius: "5px",
            background: "#eef9f2",
            color: "#168447",
            fontSize: "11px",
            fontWeight: 700,
            textAlign: "center"
          }}
        >
          {t.gripperOffsets.simulationHint}
          {" · ×"}
          {simulationSpeed}
        </div>
      )}

      <OffsetFields
        title={t.gripperOffsets.approach}
        values={effectiveOffsets.approach}
        active={previewMode === "approach"}
        simulation={getSimulation(
          "approach",
          t.gripperOffsets.simulateApproach
        )}
        onTitleClick={() => {
          togglePreview("approach");
        }}
        onChange={(axis, value) => {
          changeOffset(
            "approach",
            axis,
            value
          );
        }}
      />

      <OffsetFields
        title={t.gripperOffsets.retreat}
        values={effectiveOffsets.retreat}
        active={previewMode === "retreat"}
        simulation={getSimulation(
          "retreat",
          t.gripperOffsets.simulateRetreat
        )}
        onTitleClick={() => {
          togglePreview("retreat");
        }}
        onChange={(axis, value) => {
          changeOffset(
            "retreat",
            axis,
            value
          );
        }}
      />

      {editingPiece && hasCustomOffsets && (
        <button
          type="button"
          onClick={() => {
            onUseGenericOffsets(
              selectedPiece.id
            );
          }}
          style={{
            width: "100%",
            height: "32px",
            marginTop: "9px",
            border: "1px solid #aeb6bf",
            borderRadius: "5px",
            background: "#ffffff",
            color: "#4f5870",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {t.gripperOffsets.useGeneric}
        </button>
      )}
    </div>
  );
}
