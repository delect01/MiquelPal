import NumericInput from "./NumericInput.jsx";
import { GRASP_COLOR } from "../utils/graspGroups.js";

const smallButtonStyle = {
  flex: 1,
  minWidth: 0,
  height: "32px",
  padding: "0 8px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer"
};

function describeIssue(t, issue, pieces) {
  const piece = pieces.find((item) => item.id === issue.pieceId);
  const name = piece?.name ?? `#${issue.pieceId}`;
  const describe = t.layer.graspIssues?.[issue.reason];
  return describe ? describe(name) : issue.reason;
}

/*
  Botó "Definir agafades" i, mentre s'hi treballa, la
  proposta en curs: nombre de peces, ajust del TCP,
  avisos i accions. Fora del mode, la llista
  d'agafades que cal revisar.
*/
export default function GraspGroupPanel({
  pieces,
  disabled,
  isDefining,
  draft,
  draftMembers,
  evaluation,
  message,
  reviewGroups,
  onToggle,
  onAdjust,
  onConfirm,
  onCancel,
  onDissolve,
  t
}) {
  const issues = evaluation?.issues ?? [];

  return (
    <div data-grasp-panel="true">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={isDefining}
        style={{
          width: "100%",
          height: "34px",
          marginTop: "8px",
          boxSizing: "border-box",
          padding: "0 10px",
          border: `1px solid ${isDefining ? GRASP_COLOR : disabled ? "#aeb6bf" : GRASP_COLOR}`,
          borderRadius: "6px",
          background: isDefining ? GRASP_COLOR : disabled ? "#eceff2" : "#ffffff",
          color: isDefining ? "#ffffff" : disabled ? "#7b848d" : GRASP_COLOR,
          fontSize: "12px",
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer"
        }}
      >
        {t.layer.defineGrasps}
      </button>

      {isDefining && (
        <div
          style={{
            marginTop: "8px",
            padding: "9px",
            border: `1px solid ${GRASP_COLOR}`,
            borderRadius: "6px",
            background: "#f5f0ff",
            color: "#3b2470",
            fontSize: "12px"
          }}
        >
          <div style={{ fontWeight: 700, textAlign: "center" }}>
            {draft ? t.layer.graspDraftHint : t.layer.graspStartHint}
          </div>

          {draft && (
            <>
              <div style={{ marginTop: "8px", fontWeight: 700, fontSize: "13px" }}>
                {t.layer.graspCount(draftMembers.length)}
              </div>

              <div style={{ marginTop: "8px", fontWeight: 700 }}>
                {t.layer.graspAdjust}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {["x", "y"].map((axis) => (
                  <label
                    key={axis}
                    style={{ flex: 1, display: "flex", alignItems: "center", gap: "5px", fontWeight: 700 }}
                  >
                    {axis.toUpperCase()}
                    <NumericInput
                      value={draft.adjust?.[axis] ?? 0}
                      onChange={(value) => onAdjust(axis, value)}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        height: "28px",
                        boxSizing: "border-box",
                        padding: "0 6px",
                        border: "1px solid #b9a6e8",
                        borderRadius: "5px"
                      }}
                    />
                    <span style={{ color: "#6b5a96", fontWeight: 500 }}>mm</span>
                  </label>
                ))}
              </div>

              {issues.length > 0 && (
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px", color: "#8a4b00" }}>
                  {issues.map((issue) => (
                    <li key={`${issue.pieceId}-${issue.reason}`}>
                      {describeIssue(t, issue, pieces)}
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ display: "flex", gap: "6px", marginTop: "9px" }}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{ ...smallButtonStyle, border: "1px solid #9ea7b0", background: "#ffffff", color: "#303840" }}
                >
                  {t.common.cancel}
                </button>

                {draft.groupId && (
                  <button
                    type="button"
                    onClick={onDissolve}
                    style={{ ...smallButtonStyle, border: "1px solid #b02a37", background: "#ffffff", color: "#b02a37" }}
                  >
                    {t.layer.graspDissolve}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onConfirm}
                  style={{ ...smallButtonStyle, border: "none", background: GRASP_COLOR, color: "#ffffff" }}
                >
                  {t.layer.graspConfirm}
                </button>
              </div>
            </>
          )}

          {message && (
            <div style={{ marginTop: "8px", color: "#8a4b00", fontWeight: 700 }}>
              {message}
            </div>
          )}
        </div>
      )}

      {!isDefining && reviewGroups.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 9px",
            border: "1px solid #f0c36d",
            borderRadius: "6px",
            background: "#fff8e6",
            color: "#6b4a00",
            fontSize: "12px"
          }}
        >
          <div style={{ fontWeight: 700 }}>{t.layer.graspReviewTitle}</div>
          <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
            {reviewGroups.map((group) => (
              <li key={group.groupId}>
                <strong>{t.layer.graspReview(group.orderId ?? "?")}</strong>
                {": "}
                {group.issues
                  .map((issue) => describeIssue(t, issue, pieces))
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
