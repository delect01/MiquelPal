import { Html } from "@react-three/drei";
import {
  getPieceCenter
} from "../utils/pieceUtils";

export default function PieceOrderIdLabels({
  pieces,
  validation,
  onChangeOrderId,
  t
}) {
  return (
    <group>
      {pieces.map((piece) => {
        const center =
          getPieceCenter(piece);

        const hasIssue =
          validation.issuesByPieceId.has(
            piece.id
          );

        const labelOffset =
          Math.max(
            Number(piece.height) || 0,
            1
          ) / 2 + 35;

        return (
          <Html
            key={piece.id}
            position={[
              center.x,
              center.y + labelOffset,
              center.z
            ]}
            center
            transform={false}
            occlude={false}
            zIndexRange={[
              2000,
              1000
            ]}
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
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 6px",
                border: hasIssue
                  ? "2px solid #b02a37"
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
                  pointerEvents: "auto",
                  userSelect: "text"
                }}
              />
            </label>
          </Html>
        );
      })}
    </group>
  );
}
