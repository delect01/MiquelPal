import * as THREE from "three";
import { Html } from "@react-three/drei";
import {
  getPieceCenter
} from "../utils/pieceUtils.js";
import { getPieceBoundingBox } from "../utils/getPieceBoundingBox.js";
import { GRASP_COLOR, getOperations } from "../utils/graspGroups.js";

const LABEL_LIFT = 35;

/*
  Una etiqueta per operació del robot:
  - peça individual: sobre la peça (com sempre);
  - agafada múltiple: una sola, al centre del grup,
    amb el nombre de peces. Canviar-ne el número
    canvia el de tot el grup.
*/
function getLabelEntries(pieces) {
  return getOperations(pieces).map((operation) => {
    if (operation.groupId === null) {
      const piece = operation.pieces[0];
      const center = getPieceCenter(piece);

      return {
        piece,
        memberIds: [piece.id],
        position: [
          center.x,
          center.y + Math.max(Number(piece.height) || 0, 1) / 2 + LABEL_LIFT,
          center.z
        ]
      };
    }

    const box = new THREE.Box3();
    operation.pieces.forEach((piece) => box.union(getPieceBoundingBox(piece)));
    const center = box.getCenter(new THREE.Vector3());

    return {
      piece: operation.lead,
      memberIds: operation.pieces.map((piece) => piece.id),
      groupSize: operation.pieces.length,
      position: [center.x, box.max.y + LABEL_LIFT, center.z]
    };
  });
}

export default function PieceOrderIdLabels({
  pieces,
  validation,
  onChangeOrderId,
  onDefineClick = null,
  t
}) {
  /*
    Mentre es defineixen els ID, l'etiqueta tapa la peça:
    clicar-la compta com clicar la peça, i el camp només
    mostra el número assignat.
  */
  const isDefining = typeof onDefineClick === "function";

  return (
    <group>
      {getLabelEntries(pieces).map(({ piece, memberIds, groupSize, position }) => {
        const hasIssue = memberIds.some((pieceId) =>
          validation.issuesByPieceId.has(pieceId)
        );

        return (
          <Html
            key={piece.id}
            position={position}
            center
            transform={false}
            occlude={false}
            /*
              Capa més baixa de la interfície: per sota
              del panell lateral (30), del ViewCube (20)
              i de tots els diàlegs (1000+).
            */
            zIndexRange={[10, 1]}
            style={{
              pointerEvents: "auto"
            }}
          >
            <label
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();

                if (isDefining) {
                  onDefineClick(piece.id);
                }
              }}
              style={{
                cursor: isDefining ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 6px",
                border: hasIssue
                  ? "2px solid #b02a37"
                  : groupSize
                    ? `2px solid ${GRASP_COLOR}`
                    : "1px solid #2767c5",
                borderRadius: "5px",
                background: hasIssue
                  ? "#fff0f1"
                  : "rgba(255, 255, 255, 0.96)",
                color: hasIssue
                  ? "#b02a37"
                  : "#244d7c",
                fontFamily:
                  "Arial, Helvetica, sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow:
                  "0 2px 8px rgba(0, 0, 0, 0.22)",
                whiteSpace: "nowrap",
                pointerEvents: "auto",
                userSelect: "none"
              }}
            >
              {t.common.id}:

              <input
                readOnly={isDefining}
                tabIndex={isDefining ? -1 : undefined}
                type="text"
                inputMode="numeric"
                value={
                  piece.orderId ?? ""
                }
                onChange={(event) => {
                  onChangeOrderId(
                    piece.id,
                    event.target.value
                  );
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                }}
                style={{
                  width: "42px",
                  height: "23px",
                  boxSizing: "border-box",
                  padding: "0 4px",
                  border: hasIssue
                    ? "1px solid #b02a37"
                    : "1px solid #8ca9d4",
                  borderRadius: "3px",
                  background: "#ffffff",
                  color: hasIssue
                    ? "#b02a37"
                    : "#20262c",
                  fontSize: "12px",
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                  pointerEvents: isDefining ? "none" : "auto",
                  userSelect: "text"
                }}
              />

              {groupSize && (
                <span style={{ color: GRASP_COLOR }}>×{groupSize}</span>
              )}
            </label>
          </Html>
        );
      })}
    </group>
  );
}
