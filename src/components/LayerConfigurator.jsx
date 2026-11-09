import GripperOffsetsPanel from "./GripperOffsetsPanel.jsx";
import SimulateButton from "./SimulateButton.jsx";
import GraspGroupPanel from "./GraspGroupPanel.jsx";

export default function LayerConfigurator({
  layerName,
  onNewLayer,
  operationMode,
  onOperationModeChange,
  onLayerNameChange,
  onSaveLayer,
  layers,
  activeLayerId,
  onSelectLayer,
  onDeleteLayer,
  isCurrentLayerDirty,
  showOrderIds,
  onToggleOrderIds,
  isDefiningOrderIds,
  definedOrderIdCount,
  pieceCount,
  operationCount = pieceCount,
  onToggleDefineOrderIds,
  showGripperOffsets,
  onToggleGripperOffsets,
  selectedPiece,
  genericGripperOffsets,
  gripperOffsetPreviewMode,
  onGripperOffsetPreviewModeChange,
  onChangeGenericGripperOffset,
  onChangePieceGripperOffset,
  onUseGenericGripperOffsets,
  hasGripper,
  offsetSimulationMode,
  onSimulateOffset,
  simulatingLayerId,
  onSimulateLayer,
  simulationSpeed = 1,
  graspPanel = null,
  t
}) {
  const otherOperationMode =
    operationMode === "depalletizing" ? "palletizing" : "depalletizing";

  const labels = {
    title: t?.layer?.title ?? "CONFIGURADOR DE CAPES",
    newEmpty: t?.layer?.newEmpty ?? "Nova capa buida",
    save: t?.layer?.save ?? "Guardar capa",
    placeholder: t?.layer?.placeholder ?? "Exemple: Capa parell",
    idsOn: t?.layer?.idsOn ?? "ID activats",
    idsOff: t?.layer?.idsOff ?? "ID desactivats",
    defineIds: t?.layer?.defineIds ?? "Definir ID's",
    palletizing: t?.layer?.palletizingMode ?? "Paletitzat",
    depalletizing:
      t?.layer?.depalletizingMode ?? "Despaletitzat",
    defineIdsHint: (done, total) =>
      t?.layer?.defineIdsHint?.(done, total) ??
      `Clica les peces en ordre de col·locació · ${done}/${total} · Esc per acabar`,
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
      `Eliminar ${name}`,
    simulate: (name) =>
      t?.layer?.simulate?.(name) ?? `Simular ${name}`,
    simulationNeedsGripper:
      t?.layer?.simulationNeedsGripper ??
      "Cal aplicar una pinça per simular la capa.",
    simulationHint:
      t?.layer?.simulationHint ??
      "Simulant la capa · prem Esc per sortir"
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
          marginBottom: "8px",
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

      {/* Nom de la capa i desar (icona) */}
      <div style={{
        display: "flex",
        gap: "8px"
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
            flex: 1,
            minWidth: 0,
            height: "34px",
            boxSizing: "border-box",
            padding: "0 8px",
            border: "1px solid #aeb6bf",
            borderRadius: "6px",
            background: "#ffffff",
            color: "#20262c",
            fontSize: "13px"
          }}
        />

        <button
          type="button"
          onClick={onSaveLayer}
          title={labels.save}
          aria-label={labels.save}
          style={{
            flex: "0 0 40px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: "none",
            borderRadius: "6px",
            background: "#2767c5",
            color: "#ffffff",
            cursor: "pointer"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
      </div>

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

      {/* Definir ID's (ample, com el nom) i mostrar/amagar els ID (ull) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "8px"
        }}
      >
      <button
        type="button"
        onClick={onToggleDefineOrderIds}
        disabled={pieceCount === 0}
        style={{
          flex: 1,
          minWidth: 0,
          height: "34px",
          boxSizing: "border-box",
          padding: "0 10px",
          border: isDefiningOrderIds
            ? "1px solid #c26a00"
            : "1px solid #aeb6bf",
          borderRadius: "6px",
          background: isDefiningOrderIds
            ? "#c26a00"
            : pieceCount === 0
              ? "#eceff2"
              : "#ffffff",
          color: isDefiningOrderIds
            ? "#ffffff"
            : pieceCount === 0
              ? "#7b848d"
              : "#303840",
          fontSize: "12px",
          fontWeight: 700,
          cursor: pieceCount === 0 ? "not-allowed" : "pointer"
        }}
      >
        {labels.defineIds}
      </button>

      <button
        type="button"
        onClick={onToggleOrderIds}
        aria-pressed={showOrderIds}
        title={showOrderIds ? labels.idsOn : labels.idsOff}
        aria-label={showOrderIds ? labels.idsOn : labels.idsOff}
        style={{
          flex: "0 0 40px",
          height: "34px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
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
          cursor: "pointer"
        }}
      >
        {/* Ull obert: ID visibles; ull ratllat: amagats */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
          {!showOrderIds && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>
      </div>

      {isDefiningOrderIds && (
        <div style={{
          marginTop: "8px",
          padding: "7px 9px",
          borderRadius: "5px",
          background: "#fff4e5",
          color: "#8a4b00",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center"
        }}>
          {labels.defineIdsHint(definedOrderIdCount, operationCount)}
        </div>
      )}

      {graspPanel && <GraspGroupPanel {...graspPanel} t={t} />}

      {/* Gripper offsets (esquerra) i sentit de treball (dreta) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "8px",
        marginTop: "8px"
      }}>
        <button
          type="button"
          onClick={onToggleGripperOffsets}
          style={{
            width: "100%",
            minWidth: 0,
            height: "30px",
            boxSizing: "border-box",
            padding: "0 8px",
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
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {labels.gripperOffsets}
        </button>

        {/* Un sol botó: cada clic alterna paletitzat / despaletitzat */}
        <button
          type="button"
          data-operation-mode={operationMode}
          title={labels[otherOperationMode]}
          onClick={() => onOperationModeChange(otherOperationMode)}
          style={{
            width: "100%",
            minWidth: 0,
            height: "30px",
            boxSizing: "border-box",
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: "1px solid #4f5870",
            borderRadius: "6px",
            background: "#4f5870",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {labels[operationMode === "depalletizing" ? "depalletizing" : "palletizing"]}
          </span>
          <span aria-hidden="true">⇄</span>
        </button>
      </div>

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
          hasGripper={hasGripper}
          simulationMode={offsetSimulationMode}
          onSimulate={onSimulateOffset}
          simulationSpeed={simulationSpeed}
        />
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

        {simulatingLayerId && (
          <div style={{
            marginBottom: "7px",
            padding: "6px 8px",
            borderRadius: "5px",
            background: "#eef9f2",
            color: "#168447",
            fontSize: "11px",
            fontWeight: 700,
            textAlign: "center"
          }}>
            {labels.simulationHint}
            {" · ×"}
            {simulationSpeed}
          </div>
        )}

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
                    gridTemplateColumns: "minmax(0, 1fr) 34px 34px",
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

                  <SimulateButton
                    size={34}
                    running={simulatingLayerId === layer.id}
                    disabled={!hasGripper || layer.pieces.length === 0}
                    title={
                      hasGripper
                        ? labels.simulate(layer.name)
                        : labels.simulationNeedsGripper
                    }
                    onClick={() => onSimulateLayer(layer.id)}
                  />

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
