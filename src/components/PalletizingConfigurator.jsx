import {
  getLayerVerticalBounds
} from "../utils/palletizingUtils";

export default function PalletizingConfigurator({
  layers,
  sequence,
  selectedInstanceId,
  onAddLayer,
  onSelectInstance,
  t
}) {
  const layerById = new Map(
    layers.map(
      (layer) => [layer.id, layer]
    )
  );

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
      <h4
        style={{
          margin: "0 0 10px 0",
          color: "#4f5870",
          fontSize: "14px",
          textAlign: "center"
        }}
      >
        {t.palletizing.title}
      </h4>

      <div
        style={{
          marginBottom: "7px",
          color: "#4f5870",
          fontSize: "12px",
          fontWeight: 700
        }}
      >
        {t.palletizing.availableLayers}
      </div>

      {layers.length === 0 ? (
        <div
          style={{
            padding: "10px",
            border: "1px dashed #b8c0c8",
            borderRadius: "6px",
            background: "#f7f8fa",
            color: "#66717c",
            fontSize: "12px",
            textAlign: "center"
          }}
        >
          {t.palletizing.saveLayerFirst}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {layers.map((layer) => {
            const bounds =
              getLayerVerticalBounds(layer);

            return (
              <div
                key={layer.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 34px",
                  gap: "6px",
                  alignItems: "center"
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: "8px",
                    padding: "0 9px",
                    border:
                      "1px solid #aeb6bf",
                    borderRadius: "5px",
                    background: "#ffffff",
                    color: "#303840",
                    fontSize: "12px"
                  }}
                  title={layer.name}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 600
                    }}
                  >
                    {layer.name}
                  </span>

                  <span
                    style={{
                      flexShrink: 0,
                      color: "#66717c",
                      fontSize: "10px"
                    }}
                  >
                    {bounds.height.toFixed(1)} mm
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onAddLayer(layer.id);
                  }}
                  aria-label={t.palletizing.addLayer(layer.name)}
                  title={t.palletizing.addLayer(layer.name)}
                  style={{
                    width: "34px",
                    height: "34px",
                    border: "none",
                    borderRadius: "5px",
                    background: "#2767c5",
                    color: "#ffffff",
                    fontSize: "22px",
                    lineHeight: 1,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid #d7dce1"
        }}
      >
        <div
          style={{
            marginBottom: "7px",
            color: "#4f5870",
            fontSize: "12px",
            fontWeight: 700
          }}
        >
          {t.palletizing.sequence}
        </div>

        {sequence.length === 0 ? (
          <div
            style={{
              padding: "10px",
              border: "1px dashed #b8c0c8",
              borderRadius: "6px",
              background: "#f7f8fa",
              color: "#66717c",
              fontSize: "12px",
              textAlign: "center"
            }}
          >
            {t.palletizing.noLayersAdded}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            {sequence.map(
              (item, index) => {
                const sourceLayer =
                  layerById.get(
                    item.sourceLayerId
                  );

                const isSelected =
                  item.instanceId ===
                  selectedInstanceId;

                return (
                  <button
                    key={item.instanceId}
                    type="button"
                    onClick={() => {
                      onSelectInstance(
                        item.instanceId
                      );
                    }}
                    style={{
                      height: "34px",
                      padding: "0 9px",
                      border: isSelected
                        ? "1px solid #2767c5"
                        : "1px solid #aeb6bf",
                      borderRadius: "5px",
                      background: isSelected
                        ? "#eef4fb"
                        : "#ffffff",
                      color: isSelected
                        ? "#2767c5"
                        : "#303840",
                      fontSize: "12px",
                      fontWeight: isSelected
                        ? 700
                        : 600,
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    {index + 1}. {sourceLayer?.name || t.palletizing.layerUnavailable}
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "9px",
          color: "#66717c",
          fontSize: "11px",
          lineHeight: 1.4
        }}
      >
        {t.palletizing.deleteHelp}
      </div>
    </section>
  );
}
