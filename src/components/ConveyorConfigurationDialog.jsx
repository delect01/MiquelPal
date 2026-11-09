import { useEffect, useMemo, useState } from "react";
import ConveyorPreview from "./ConveyorPreview.jsx";
import ConveyorPlacementPanel, { ConveyorTcpSummary } from "./ConveyorPlacementPanel.jsx";
import GraspSettingsPanel from "./GraspSettingsPanel.jsx";
import useCollisionGeometryVersion from "../hooks/useCollisionGeometryVersion.js";
import {
  createConveyorConfiguration,
  buildConfiguredPiece,
  evaluateConveyorConfiguration,
  finalizeConveyorConfiguration,
  getPieceGeometryVersion,
  resolveFaceId
} from "../utils/conveyorConfigurations.js";
import {
  getConveyorBeltWidth,
  isValidBeltWidth
} from "../utils/conveyorPlacement.js";

const NARROW_WIDTH = 900;

const sectionStyle = {
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  background: "#ffffff"
};

const titleStyle = {
  margin: "0 0 10px 0",
  color: "#4f5870",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.4px",
  textTransform: "uppercase"
};

const warningStyle = {
  marginTop: "10px",
  padding: "8px 10px",
  borderRadius: "5px",
  background: "#fff0f1",
  color: "#b02a37",
  fontSize: "12px",
  fontWeight: 600
};

function cloneConfiguration(configuration) {
  return JSON.parse(JSON.stringify(configuration));
}

function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(
    () => window.innerWidth < NARROW_WIDTH
  );

  useEffect(() => {
    function handleResize() {
      setIsNarrow(window.innerWidth < NARROW_WIDTH);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isNarrow;
}

/*
  Configuració inicial en obrir el popup: l'existent de
  la peça o valors segurs nous. Si la geometria de la peça
  ha canviat, les cares es comproven: es retroben per la
  seva normal i centre o es buiden.
*/
function prepareDraft(configuration, piece) {
  const draft = configuration
    ? cloneConfiguration(configuration)
    : createConveyorConfiguration(piece.id);

  // (null = volum encara en càlcul: no es pot comparar)
  const currentVersion = getPieceGeometryVersion(piece);

  if (
    draft.pieceGeometryVersion &&
    currentVersion &&
    draft.pieceGeometryVersion !== currentVersion
  ) {
    draft.placement.contactFaceId = resolveFaceId(
      piece,
      draft.placement.contactFaceId,
      draft.placement.contactFaceReference
    );
    draft.grasp.graspFaceId = resolveFaceId(
      piece,
      draft.grasp.graspFaceId,
      draft.grasp.graspFaceReference
    );
  }

  return draft;
}

/*
  Popup de configuració de cinta d'una peça concreta:
  controls a l'esquerra i visualitzador 3D a la dreta.

  No es pot canviar de peça des d'aquí. La peça de la
  biblioteca no es modifica mai, i Cancel·lar no guarda
  res. L'estat s'inicialitza en muntar-se: App el torna a
  muntar (key) per a cada peça.
*/
export default function ConveyorConfigurationDialog({
  piece,
  configuration,
  activeGripper,
  onSave,
  onClose,
  t
}) {
  const isNarrow = useIsNarrow();
  const [draft, setDraft] = useState(() =>
    prepareDraft(configuration, piece)
  );
  const [geometryReviewed, setGeometryReviewed] = useState(false);
  const [isGripperVisible, setIsGripperVisible] = useState(false);

  /*
    Amplada de la cinta: és global (la mateixa per a
    totes les peces i projectes). Aquí es pot canviar; en
    guardar passa a ser la nova amplada per a tothom.
  */
  const [beltWidth, setBeltWidth] = useState(getConveyorBeltWidth);

  // Canvia quan s'acaba de calcular el volum d'un model importat
  const collisionGeometryVersion = useCollisionGeometryVersion();

  // Es recalcula automàticament amb qualsevol canvi
  const evaluation = useMemo(
    () =>
      evaluateConveyorConfiguration(draft, piece, {
        geometryReviewed,
        beltWidth,
        // El resultat depèn del volum carregat del model
        collisionGeometryVersion
      }),
    [draft, piece, geometryReviewed, beltWidth, collisionGeometryVersion]
  );

  const configuredPiece = useMemo(
    () =>
      buildConfiguredPiece(
        draft,
        piece,
        isValidBeltWidth(beltWidth) ? Number(beltWidth) : getConveyorBeltWidth()
      ),
    [draft, piece, beltWidth]
  );

  function updatePlacement(changes) {
    setDraft((current) => ({
      ...current,
      placement: { ...current.placement, ...changes }
    }));
  }

  function updateGrasp(changes) {
    setDraft((current) => ({
      ...current,
      grasp: { ...current.grasp, ...changes }
    }));
  }

  function save() {
    if (!evaluation.canSave) {
      return;
    }

    onSave(
      finalizeConveyorConfiguration(draft, piece, {
        geometryReviewed,
        beltWidth: Number(beltWidth)
      })
    );
  }

  // Estat i motiu del TCP per al resum
  let statusKey = "incomplete";
  let reasonText = null;

  if (evaluation.geometryChanged) {
    statusKey = "geometryChanged";
  } else if (evaluation.tcpPose.valid) {
    statusKey = "valid";
  } else if (evaluation.result?.status === "error") {
    statusKey = "error";
    reasonText = t.conveyor.reasons[evaluation.tcpPose.reason];
  } else {
    reasonText = t.conveyor.reasons[evaluation.tcpPose.reason] ?? null;
  }

  const placementResult = evaluation.result
    ? { ...evaluation.result, tcpPose: evaluation.tcpPose }
    : null;

  const missingText = evaluation.missing
    .map((key) => t.conveyorConfigurator.missing[key])
    .join(", ");

  const viewerHeight = isNarrow ? "380px" : "100%";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,25,30,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        style={{
          width: "min(1240px, 96vw)",
          height: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        {/* Capçalera fixa */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: "1px solid #d7dce1"
          }}
        >
          <div style={{ textAlign: "start" }}>
            <h2 style={{ margin: 0 }}>{t.conveyorConfigurator.dialogTitle}</h2>
            <div style={{ marginTop: "4px", color: "#59636e", fontWeight: 700 }}>
              {piece.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.conveyorConfigurator.close}
            style={{ width: "38px", height: "38px", borderRadius: "50%" }}
          >
            ×
          </button>
        </div>

        {/* Cos: controls (esquerra) + visualitzador (dreta) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: isNarrow
              ? "minmax(0, 1fr)"
              : "minmax(0, 2fr) minmax(0, 3fr)",
            gap: "16px",
            padding: "14px 16px",
            overflowY: isNarrow ? "auto" : "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              minHeight: 0,
              overflowY: isNarrow ? "visible" : "auto",
              paddingRight: isNarrow ? 0 : "4px",
              order: isNarrow ? 2 : 1
            }}
          >
            {/* Informació de la peça (només lectura) */}
            <section style={sectionStyle}>
              <h4 style={titleStyle}>{t.conveyorConfigurator.pieceInfoTitle}</h4>
              <div style={{ color: "#303840", fontSize: "13px", lineHeight: 1.6 }}>
                <strong>{piece.name}</strong>
              </div>

              {evaluation.geometryChanged && (
                <div role="alert" style={warningStyle}>
                  {t.conveyorConfigurator.geometryChangedWarning}
                  <button
                    type="button"
                    onClick={() => setGeometryReviewed(true)}
                    style={{
                      display: "block",
                      marginTop: "7px",
                      height: "30px",
                      padding: "0 10px",
                      border: "1px solid #b02a37",
                      borderRadius: "5px",
                      background: "#ffffff",
                      color: "#b02a37",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {t.conveyorConfigurator.confirmReview}
                  </button>
                </div>
              )}

              {evaluation.migrationReview && (
                <div role="alert" style={warningStyle}>
                  {t.conveyorConfigurator.migrationWarning}
                </div>
              )}
            </section>

            <ConveyorPlacementPanel
              piece={configuredPiece}
              placement={{
                contactFaceId: draft.placement.contactFaceId,
                rotationDeg: draft.placement.rotationDeg,
              }}
              beltWidth={beltWidth}
              onChangeBeltWidth={setBeltWidth}
              onChangePlacement={updatePlacement}
              t={t}
            />

            <GraspSettingsPanel
              piece={configuredPiece}
              graspFaceId={draft.grasp.graspFaceId}
              onChange={updateGrasp}
              hasGripper={Boolean(activeGripper)}
              isGripperVisible={isGripperVisible && Boolean(activeGripper)}
              onToggleGripper={() =>
                setIsGripperVisible((currentValue) => !currentValue)
              }
              t={t}
            />

            <ConveyorTcpSummary
              statusKey={statusKey}
              reasonText={reasonText}
              tcpPose={evaluation.tcpPose}
              t={t}
            />
          </div>

          {/* Visualitzador: sempre visible mentre s'editen els camps */}
          <div
            style={{
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              order: isNarrow ? 1 : 2
            }}
          >
            {placementResult && (
              <ConveyorPreview
                piece={configuredPiece}
                placementResult={placementResult}
                fitKey={`${piece.id}|${evaluation.currentVersion}`}
                graspFaceId={draft.grasp.graspFaceId}
                height={viewerHeight}
                gripper={activeGripper}
                showGripper={isGripperVisible}
                onSelectContactFace={(faceId) =>
                  updatePlacement({ contactFaceId: faceId })
                }
                t={t}
              />
            )}
          </div>
        </div>

        {/* Peu fix: només Cancel·lar i Guardar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderTop: "1px solid #d7dce1"
          }}
        >
          {!evaluation.canSave && (
            <div
              role="status"
              style={{ marginRight: "auto", color: "#8a4b00", fontSize: "13px", fontWeight: 700 }}
            >
              {t.conveyorConfigurator.missingTitle} {missingText}
            </div>
          )}
          <button type="button" onClick={onClose} style={{ padding: "10px 18px" }}>
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!evaluation.canSave}
            style={{
              padding: "10px 22px",
              background: evaluation.canSave ? "#168447" : "#aeb6bf",
              color: "white",
              border: 0,
              borderRadius: "6px",
              fontWeight: 700,
              cursor: evaluation.canSave ? "pointer" : "not-allowed"
            }}
          >
            {t.conveyorConfigurator.save}
          </button>
        </div>
      </div>
    </div>
  );
}
