export default function UnsavedLayerDialog({
  open,
  currentLayerName,
  onSave,
  onDiscard,
  onCancel,
  t
}) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={t.unsavedLayer.title} style={{ position: "fixed", inset: 0, zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(20, 25, 30, 0.72)" }}>
      <div style={{ width: "min(500px, 94vw)", boxSizing: "border-box", padding: "18px", border: "1px solid #c6ccd2", borderRadius: "10px", background: "#ffffff", boxShadow: "0 18px 60px rgba(0, 0, 0, 0.35)" }}>
        <h2 style={{ margin: "0 0 9px 0", color: "#a1262f", fontSize: "20px" }}>{t.unsavedLayer.title}</h2>
        <div style={{ color: "#59636e", fontSize: "14px", lineHeight: 1.5 }}>{t.unsavedLayer.message(currentLayerName)}</div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #d7dce1" }}>
          <button type="button" onClick={onCancel} style={{ padding: "9px 16px", border: "1px solid #9ea7b0", borderRadius: "6px", background: "#ffffff", color: "#303840", cursor: "pointer" }}>{t.common.cancel}</button>
          <button type="button" onClick={onDiscard} style={{ padding: "9px 16px", border: "none", borderRadius: "6px", background: "#b02a37", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>{t.unsavedLayer.discard}</button>
          <button type="button" onClick={onSave} style={{ padding: "9px 18px", border: "none", borderRadius: "6px", background: "#168447", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>{t.layerUi.save}</button>
        </div>
      </div>
    </div>
  );
}
