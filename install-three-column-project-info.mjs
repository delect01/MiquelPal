import {
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import { resolve } from "node:path";

const dialogPath = resolve(
  process.cwd(),
  "src/components/OpenProjectDialog.jsx"
);
const previewPath = resolve(
  process.cwd(),
  "src/components/ProjectPalletizingPreview.jsx"
);

const dialogBackup =
  `${dialogPath}.three-column-backup`;
const previewBackup =
  `${previewPath}.three-column-backup`;

let dialog = await readFile(
  dialogPath,
  "utf8"
);
let preview = await readFile(
  previewPath,
  "utf8"
);

await copyFile(
  dialogPath,
  dialogBackup
);
await copyFile(
  previewPath,
  previewBackup
);

/*
  Localitzem la seccio inferior d'Informacio.
  La seccio compacta ja porta gridColumn: "1 / -1".
*/
const sectionStartToken = `            <section style={{
              gridColumn: "1 / -1",`;

const sectionStart =
  dialog.indexOf(sectionStartToken);

if (sectionStart === -1) {
  throw new Error(
    "[NO TROBAT] No s'ha localitzat la seccio inferior Informacio. Executa primer la versio compacta del popup."
  );
}

const sectionEndToken =
  "            </section>";

const sectionEnd =
  dialog.indexOf(
    sectionEndToken,
    sectionStart
  );

if (sectionEnd === -1) {
  throw new Error(
    "[NO TROBAT] No s'ha localitzat el final de la seccio Informacio."
  );
}

const replacement = `            <section
              style={{
                gridColumn: "1 / -1",
                padding: "10px 12px",
                border: "1px solid #d7dce1",
                borderRadius: "7px",
                background: "#ffffff"
              }}
            >
              {selectedProject ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(220px, 1fr) minmax(180px, 0.8fr) minmax(280px, 1.4fr)",
                    gap: "14px",
                    alignItems: "start"
                  }}
                >
                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Informació
                    </div>

                    <div
                      style={{
                        color: "#303840",
                        fontSize: "14px",
                        fontWeight: 700
                      }}
                    >
                      {selectedProject.name}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#66717c",
                        fontSize: "12px"
                      }}
                    >
                      Modificat:{" "}
                      {formatProjectDate(
                        selectedProject.updatedAt ??
                        selectedProject.createdAt
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Paletitzat
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0, 1fr) auto",
                        gap: "5px 10px",
                        color: "#404850",
                        fontSize: "12px"
                      }}
                    >
                      <strong>Peces totals</strong>
                      <span>
                        {previewData.regularPieces.length}
                      </span>

                      <strong>Instàncies de capa</strong>
                      <span>
                        {previewData.layers.length}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Models de peça
                    </div>

                    {previewData.modelNames.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "5px"
                        }}
                      >
                        {previewData.modelNames.map(
                          (name) => (
                            <span
                              key={name}
                              style={{
                                padding: "4px 7px",
                                border: "1px solid #cbd3da",
                                borderRadius: "999px",
                                background: "#f4f6f8",
                                color: "#404850",
                                fontSize: "11px"
                              }}
                            >
                              {name}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          color: "#66717c",
                          fontSize: "12px"
                        }}
                      >
                        -
                      </span>
                    )}
                  </div>

                  {!previewData.hasPalletizing && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "6px 8px",
                        borderRadius: "5px",
                        background: "#fff7e8",
                        color: "#8a5a00",
                        fontSize: "11px"
                      }}
                    >
                      Aquest projecte no té una seqüència de paletitzat. Es mostra la composició actual.
                    </div>
                  )}
                </div>
              ) : (
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
                  Selecciona un projecte per veure'n la informació.
                </div>
              )}

              {feedbackMessage && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "7px",
                    borderRadius: "5px",
                    background: "#eef4fb",
                    color: "#244d7c",
                    fontSize: "12px"
                  }}
                >
                  {feedbackMessage}
                </div>
              )}
            </section>`;

dialog =
  dialog.slice(0, sectionStart) +
  replacement +
  dialog.slice(
    sectionEnd +
    sectionEndToken.length
  );

/*
  Reduim una mica mes les dues zones superiors.
*/
dialog = dialog
  .replace(
    'height: "270px",',
    'height: "235px",'
  )
  .replace(
    'size={9}',
    'size={8}'
  );

preview = preview.replace(
  'height: "270px",',
  'height: "235px",'
);

await writeFile(
  dialogPath,
  dialog,
  "utf8"
);
await writeFile(
  previewPath,
  preview,
  "utf8"
);

const verification = {
  informationColumn:
    dialog.includes("Informació"),
  palletizingColumn:
    dialog.includes("Paletitzat"),
  modelsColumn:
    dialog.includes("Models de peça"),
  threeColumns:
    dialog.includes(
      'minmax(220px, 1fr) minmax(180px, 0.8fr) minmax(280px, 1.4fr)'
    ),
  compactHeight:
    dialog.includes('height: "235px"') &&
    preview.includes('height: "235px"')
};

console.log("VERIFICACIO:", verification);

if (Object.values(verification).some((value) => !value)) {
  throw new Error(
    "La verificacio final ha fallat. Pots restaurar les copies de seguretat."
  );
}

console.log(
  "[OK] Informacio repartida en tres columnes i popup compactat."
);
console.log(
  `Copies: ${dialogBackup} i ${previewBackup}`
);
