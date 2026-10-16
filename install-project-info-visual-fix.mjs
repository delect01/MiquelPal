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

const backupPath =
  `${dialogPath}.info-visual-backup`;

let source = await readFile(
  dialogPath,
  "utf8"
);

await copyFile(
  dialogPath,
  backupPath
);

let changes = 0;

function replaceRequired(
  oldText,
  newText,
  label
) {
  if (source.includes(newText)) {
    console.log(`[SKIP] ${label}`);
    return;
  }

  if (!source.includes(oldText)) {
    throw new Error(
      `[NO TROBAT] ${label}`
    );
  }

  source = source.replace(
    oldText,
    newText
  );

  changes += 1;
  console.log(`[OK] ${label}`);
}

/*
  1. Fixem explicitament cadascun dels tres blocs
  a la seva columna. Això evita que els models
  apareguin dins de la zona central.
*/
replaceRequired(
`                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Informació`,
`                  <div
                    style={{
                      gridColumn: "1",
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        padding: "6px 9px",
                        borderRadius: "5px",
                        background: "#eef4fb",
                        color: "#315f91",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Informació`,
  "fixar Informacio a la primera columna"
);

replaceRequired(
`                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Paletitzat`,
`                  <div
                    style={{
                      gridColumn: "2",
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        padding: "6px 9px",
                        borderRadius: "5px",
                        background: "#eef4fb",
                        color: "#315f91",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Paletitzat`,
  "fixar Paletitzat a la segona columna"
);

replaceRequired(
`                  <div>
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#4f5870",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Models de peça`,
`                  <div
                    style={{
                      gridColumn: "3",
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        padding: "6px 9px",
                        borderRadius: "5px",
                        background: "#eef4fb",
                        color: "#315f91",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      Models de peça`,
  "fixar Models de peça a la tercera columna"
);

/*
  2. Substituim les etiquetes arrodonides per una
  llista neta i compacta dins de la tercera columna.
*/
replaceRequired(
`                    {previewData.modelNames.length > 0 ? (
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
                    ) : (`,
`                    {previewData.modelNames.length > 0 ? (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "18px",
                          color: "#404850",
                          fontSize: "12px",
                          lineHeight: 1.45
                        }}
                      >
                        {previewData.modelNames.map(
                          (name) => (
                            <li
                              key={name}
                              style={{
                                marginBottom: "2px",
                                overflowWrap: "anywhere"
                              }}
                            >
                              {name}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (`,
  "mostrar models com una llista normal"
);

await writeFile(
  dialogPath,
  source,
  "utf8"
);

const result = await readFile(
  dialogPath,
  "utf8"
);

const verification = {
  firstColumn:
    result.includes('gridColumn: "1"'),
  secondColumn:
    result.includes('gridColumn: "2"'),
  thirdColumn:
    result.includes('gridColumn: "3"'),
  coloredHeaders:
    (
      result.match(
        /background: "#eef4fb"/g
      ) ?? []
    ).length >= 3,
  normalModelList:
    result.includes(
      'overflowWrap: "anywhere"'
    )
};

console.log("\nVERIFICACIO:", verification);

if (
  Object.values(verification)
    .some((value) => !value)
) {
  throw new Error(
    "La verificacio final ha fallat. Pots restaurar la copia de seguretat."
  );
}

console.log(
  `\n[FINALITZAT] Canvis aplicats: ${changes}`
);
console.log(
  `Copia de seguretat: ${backupPath}`
);
