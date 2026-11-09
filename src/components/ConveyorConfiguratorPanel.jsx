import { useState } from "react";
import {
  panelButtonStyle,
  panelSectionStyle,
  panelTitleStyle
} from "../styles/appStyles.js";

const STATE_STYLES = {
  configured: { background: "#eef9f2", color: "#168447" },
  notConfigured: { background: "#eef1f4", color: "#59636e" },
  needsReview: { background: "#fff0f1", color: "#b02a37" },
  notSaved: { background: "#fff4e5", color: "#8a4b00" },
  templateMissing: { background: "#fff4e5", color: "#8a4b00" }
};

// Peces sense plantilla a la biblioteca
const UNSAVED_STATES = ["notSaved", "templateMissing"];

// Nom de la fila: el de la plantilla o els de les peces iguals del palet
function getItemName(item) {
  return item.names?.length ? item.names.join(", ") : String(item.piece.name ?? "");
}

const smallButtonStyle = {
  ...panelButtonStyle,
  flex: "0 0 auto",
  height: "28px",
  padding: "0 9px",
  fontSize: "11px"
};

/*
  CONFIGURADOR DE CINTA (panell lateral): totes les peces
  guardades amb el seu estat de configuració.

  items: [{ key, piece, configuration, state, groupKey?, names? }]
  Les files sense plantilla (notSaved / templateMissing)
  tenen groupKey i es guarden amb onSaveAndConfigure.
*/
export default function ConveyorConfiguratorPanel({
  items,
  onConfigure,
  onSaveAndConfigure,
  onDelete,
  t
}) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = [...items]
    .filter((item) =>
      getItemName(item).toLowerCase().includes(normalizedSearch)
    )
    .sort((itemA, itemB) =>
      getItemName(itemA).localeCompare(getItemName(itemB), "ca")
    );

  return (
    <section style={{ ...panelSectionStyle, marginBottom: "12px" }}>
      <h4 style={panelTitleStyle}>{t.conveyorConfigurator.title}</h4>

      {items.length === 0 ? (
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
          {t.conveyorConfigurator.noPieces}
        </div>
      ) : (
        <>
          <input
            type="search"
            value={search}
            placeholder={t.conveyorConfigurator.search}
            aria-label={t.conveyorConfigurator.search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              height: "32px",
              boxSizing: "border-box",
              marginBottom: "8px",
              padding: "0 8px",
              border: "1px solid #aeb6bf",
              borderRadius: "6px",
              fontSize: "12px"
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "360px",
              overflowY: "auto"
            }}
          >
            {visibleItems.length === 0 && (
              <div style={{ color: "#66717c", fontSize: "12px", textAlign: "center" }}>
                {t.conveyorConfigurator.noResults}
              </div>
            )}

            {visibleItems.map((item) => {
              const { piece, state } = item;
              const name = getItemName(item);

              return (
              <div
                key={item.key}
                data-piece-row={name}
                data-state={state}
                style={{
                  padding: "7px 9px",
                  border: "1px solid #d7dce1",
                  borderRadius: "6px",
                  background: "#ffffff"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span
                    title={name}
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#303840",
                      fontSize: "12px",
                      fontWeight: 700
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      flex: "0 0 auto",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      ...STATE_STYLES[state]
                    }}
                  >
                    {t.conveyorConfigurator.states[state]}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  {/* Peça del palet sense plantilla: es desa i es configura */}
                  {UNSAVED_STATES.includes(state) && (
                    <button
                      type="button"
                      onClick={() => onSaveAndConfigure(item.groupKey)}
                      style={{
                        ...smallButtonStyle,
                        border: "1px solid #2767c5",
                        background: "#2767c5",
                        color: "#ffffff"
                      }}
                    >
                      {t.conveyorConfigurator.saveAndConfigure}
                    </button>
                  )}

                  {state === "notConfigured" && (
                    <button
                      type="button"
                      onClick={() => onConfigure(piece.id)}
                      style={{
                        ...smallButtonStyle,
                        border: "1px solid #2767c5",
                        background: "#2767c5",
                        color: "#ffffff"
                      }}
                    >
                      {t.conveyorConfigurator.configure}
                    </button>
                  )}

                  {["configured", "needsReview"].includes(state) && (
                    <>
                      <button
                        type="button"
                        onClick={() => onConfigure(piece.id)}
                        style={
                          state === "needsReview"
                            ? {
                                ...smallButtonStyle,
                                border: "1px solid #b02a37",
                                background: "#b02a37",
                                color: "#ffffff"
                              }
                            : smallButtonStyle
                        }
                      >
                        {state === "needsReview"
                          ? t.conveyorConfigurator.review
                          : t.conveyorConfigurator.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(piece.id)}
                        style={{
                          ...smallButtonStyle,
                          border: "1px solid #b02a37",
                          color: "#b02a37"
                        }}
                      >
                        {t.conveyorConfigurator.delete}
                      </button>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
