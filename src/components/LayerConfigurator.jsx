import GripperOffsetsPanel from "./GripperOffsetsPanel.jsx";

export default function LayerConfigurator({
  layerName,
  onNewLayer,
  onLayerNameChange,
  onSaveLayer,
  layers,
  activeLayerId,
  onSelectLayer,
  onDeleteLayer,
  isCurrentLayerDirty,
  showOrderIds,
  onToggleOrderIds,
  showGripperOffsets,
  onToggleGripperOffsets,
  selectedPiece,
  genericGripperOffsets,
  gripperOffsetPreviewMode,
  onGripperOffsetPreviewModeChange,
  onChangeGenericGripperOffset,
  onChangePieceGripperOffset,
  onUseGenericGripperOffsets,
  t
}) {
  const labels = {
    title: t?.layer?.title ?? "CONFIGURADOR DE CAPES",
    newEmpty: t?.layer?.newEmpty ?? "Nova capa buida",
    save: t?.layer?.save ?? "Guardar capa",
    placeholder: t?.layer?.placeholder ?? "Exemple: Capa parell",
    idsOn: t?.layer?.idsOn ?? "ID activats",
    idsOff: t?.layer?.idsOff ?? "ID desactivats",
    gripperOffsets:
      t?.layer?.gripperOffsets ?? "Gripper offsets",
    unsavedComposition:
      t?.layer?.unsavedComposition ??
      "La composició actual té canvis sense guardar com a capa.",
    savedLayers:
      t?.layer?.savedLayers ?? "Capes guardades",
    noSavedLayers:
      t?.layer?.noSavedLayers ??
      "Encara no hi ha cap capa guardada.",
    deleteTitle:
      t?.layer?.deleteTitle ?? "Eliminar capa",
    deleteNamed: (name) =>
      t?.layer?.deleteNamed?.(name) ??
      `Eliminar ${name}`
  };

  return (
    <section
      style={{
        padding: "12px",
        border: "1px solid #d7dce1",
        borderRadius: "7px",
        background: "#ffffff",
        marginBottom: "12px"
      }}
    >
      <h4 style={{
        margin: "0 0 10px 0",
        color: "#4f5870",
        fontSize: "14px",
        textAlign: "center"
      }}>
        {labels.title}
      </h4>

      <button
        type="button"
        onClick={onNewLayer}
        style={{
          width: "100%",
          height: "34px",
          marginBottom: "9px",
          boxSizing: "border-box",
          padding: "0 10px",
          border: "1px solid #168447",
          borderRadius: "6px",
          background: "#ffffff",
          color: "#168447",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        {labels.newEmpty}
      </button>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "7px"
      }}>
        <input
          type="text"
          value={layerName}
          placeholder={labels.placeholder}
          onChange={(event) => {
            onLayerNameChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSaveLayer();
          }}
          style={{
            width: "100%",
            height: "34px",
            boxSizing: "border-box",
            padding: "0 8px",
            border: "1px solid #aeb6bf",
            borderRadius: "5px",
            background: "#ffffff",
            color: "#20262c",
            fontSize: "13px"
          }}
        />

        <button
          type="button"
          onClick={onSaveLayer}
          style={{
            height: "34px",
            padding: "0 13px",
            border: "none",
            borderRadius: "6px",
            background: "#2767c5",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {labels.save}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleOrderIds}
        style={{
          width: "100%",
          height: "34px",
          marginTop: "8px",
          boxSizing: "border-box",
          padding: "0 10px",
          border: showOrderIds
            ? "1px solid #2767c5"
            : "1px solid #aeb6bf",
          borderRadius: "6px",
          background: showOrderIds
            ? "#2767c5"
            : "#ffffff",
          color: showOrderIds
            ? "#ffffff"
            : "#303840",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        {showOrderIds
          ? labels.idsOn
          : labels.idsOff}
      </button>

      <button
        type="button"
        onClick={onToggleGripperOffsets}
        style={{
          width: "100%",
          height: "34px",
          marginTop: "8px",
          boxSizing: "border-box",
          padding: "0 10px",
          border: showGripperOffsets
            ? "1px solid #168447"
            : "1px solid #aeb6bf",
          borderRadius: "6px",
          background: showGripperOffsets
            ? "#168447"
            : "#ffffff",
          color: showGripperOffsets
            ? "#ffffff"
            : "#303840",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        {labels.gripperOffsets}
      </button>

      {showGripperOffsets && (
        <GripperOffsetsPanel
          t={t}
          selectedPiece={selectedPiece}
          genericOffsets={genericGripperOffsets}
          previewMode={gripperOffsetPreviewMode}
          onPreviewModeChange={onGripperOffsetPreviewModeChange}
          onChangeGenericOffset={onChangeGenericGripperOffset}
          onChangePieceOffset={onChangePieceGripperOffset}
          onUseGenericOffsets={onUseGenericGripperOffsets}
        />
      )}

      {isCurrentLayerDirty && (
        <div style={{
          marginTop: "8px",
          padding: "7px 9px",
          borderRadius: "5px",
          background: "#fff7e8",
          color: "#8a5a00",
          fontSize: "12px"
        }}>
          {labels.unsavedComposition}
        </div>
      )}

      <div style={{
        marginTop: "11px",
        paddingTop: "10px",
        borderTop: "1px solid #d7dce1"
      }}>
        <div style={{
          marginBottom: "7px",
          color: "#4f5870",
          fontSize: "12px",
          fontWeight: 700
        }}>
          {labels.savedLayers}
        </div>

        {layers.length === 0 ? (
          <div style={{
            padding: "10px",
            border: "1px dashed #b8c0c8",
            borderRadius: "6px",
            background: "#f7f8fa",
            color: "#66717c",
            fontSize: "12px",
            textAlign: "center"
          }}>
            {labels.noSavedLayers}
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            {layers.map((layer) => {
              const isActive = layer.id === activeLayerId;
              return (
                <div
                  key={layer.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) 34px",
                    gap: "6px"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectLayer(layer.id)}
                    style={{
                      minWidth: 0,
                      height: "34px",
                      padding: "0 9px",
                      overflow: "hidden",
                      border: isActive
                        ? "1px solid #2767c5"
                        : "1px solid #aeb6bf",
                      borderRadius: "5px",
                      background: isActive
                        ? "#eef4fb"
                        : "#ffffff",
                      color: isActive
                        ? "#2767c5"
                        : "#303840",
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 600,
                      textAlign: "left",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer"
                    }}
                    title={layer.name}
                  >
                    {layer.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteLayer(layer.id)}
                    aria-label={labels.deleteNamed(layer.name)}
                    title={labels.deleteTitle}
                    style={{
                      width: "34px",
                      height: "34px",
                      border: "1px solid #b02a37",
                      borderRadius: "5px",
                      background: "#ffffff",
                      color: "#b02a37",
                      fontSize: "17px",
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
