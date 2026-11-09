
export const panelSectionStyle = {
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  background: "#ffffff"
};

export const panelFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  marginBottom: "8px",
  color: "#404850",
  fontSize: "13px",
  fontWeight: 600
};

export const panelInputStyle = {
  width: "100%",
  height: "31px",
  boxSizing: "border-box",
  padding: "0 7px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#20262c",
  fontSize: "13px"
};

export const readOnlyInputStyle = {
  ...panelInputStyle,
  background: "#eef1f4",
  color: "#34404b",
  cursor: "default"
};

export const panelSelectStyle = {
  width: "100%",
  height: "33px",
  boxSizing: "border-box",
  padding: "0 7px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#20262c",
  fontSize: "13px",
  cursor: "pointer"
};

export const panelButtonStyle = {
  flex: 1,
  minWidth: 0,
  height: "34px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: "1px solid #aeb6bf",
  borderRadius: "6px",
  background: "#f7f8fa",
  color: "#303840",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.08)"
};

export const panelRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "92px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  marginBottom: "7px",
  color: "#404850",
  fontSize: "13px",
  fontWeight: 600
};

export const configuratorButtonStyle = {
  width: "100%",
  height: "34px",
  boxSizing: "border-box",
  padding: "0 10px",
  border: "1px solid #aeb6bf",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#303840",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.08)"
};

/*
  Panell lateral flotant de l'editor.
*/
export const sidePanelStyle = {
  position: "absolute",
  // Per sobre de l'escena 3D i de les etiquetes d'ID
  zIndex: 30,
  top: "16px",
  left: "16px",
  width: "300px",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  boxSizing: "border-box",
  padding: "14px",
  background: "#ffffff",
  border: "1px solid #c6ccd2",
  borderRadius: "10px",
  boxShadow:
    "0 12px 32px rgba(0, 0, 0, 0.22)",
  color: "#303840",
  fontFamily:
    "Arial, Helvetica, sans-serif"
};

export const panelTitleStyle = {
  margin: "0 0 9px 0",
  color: "#4f5870",
  fontSize: "14px",
  textAlign: "center"
};
