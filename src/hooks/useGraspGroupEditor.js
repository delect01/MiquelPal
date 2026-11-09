import { useEffect, useState } from "react";
import {
  getGraspGroupId,
  getGraspGroupLead,
  getGraspGroupMembers
} from "../utils/graspGroups.js";
import {
  evaluateGrasp,
  getGripperActiveZone,
  proposeGraspMembers
} from "../utils/graspGeometry.js";
import {
  applyGraspGroup,
  dissolveGraspGroup
} from "../utils/graspGroupEditing.js";

/*
  "Definir agafades": agrupa peces que la pinça agafa i
  deixa alhora.

  1. Es clica la peça guia: la pinça hi apareix
     (semitransparent) i es proposen les peces que
     podria agafar juntament amb ella.
  2. Clicar més peces les afegeix o les treu.
  3. Intro confirma: totes reben el mateix número
     d'operació. Esc descarta la proposta (un segon Esc
     surt del mode).

  Clicar una peça d'una agafada ja feta l'obre per
  editar-la o desfer-la.
*/
export default function useGraspGroupEditor({
  pieces,
  setPieces,
  gripper,
  onStart,
  t
}) {
  const [isDefiningGrasps, setIsDefiningGrasps] = useState(false);
  // { groupId (si s'edita una agafada existent), leadId, memberIds, adjust }
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState(null);

  const draftLead = draft
    ? pieces.find((piece) => piece.id === draft.leadId) ?? null
    : null;

  // La peça guia ha desaparegut (desfer, eliminar...): es descarta
  if (draft && !draftLead) {
    setDraft(null);
  }

  const draftMembers = draftLead
    ? pieces.filter((piece) => draft.memberIds.includes(piece.id))
    : [];

  const draftEvaluation = draftLead
    ? evaluateGrasp(draftMembers, draftLead, gripper, draft.adjust)
    : null;

  function startDefiningGrasps() {
    if (!gripper) {
      window.alert(t.layer.graspNeedsGripper);
      return;
    }

    if (!getGripperActiveZone(gripper)) {
      window.alert(t.layer.graspNeedsZone);
      return;
    }

    onStart();
    setDraft(null);
    setMessage(null);
    setIsDefiningGrasps(true);
  }

  function stopDefiningGrasps() {
    setDraft(null);
    setMessage(null);
    setIsDefiningGrasps(false);
  }

  function toggleDefiningGrasps() {
    if (isDefiningGrasps) {
      stopDefiningGrasps();
      return;
    }

    startDefiningGrasps();
  }

  function clickPiece(pieceId) {
    const piece = pieces.find((item) => item.id === pieceId);

    if (!piece || piece.pieceCategory === "SEPARATOR") {
      return;
    }

    const groupId = getGraspGroupId(piece);
    setMessage(null);

    // Primera peça: guia nova o agafada existent per editar
    if (!draft) {
      if (groupId !== null) {
        const lead = getGraspGroupLead(pieces, groupId);

        setDraft({
          groupId,
          leadId: lead.id,
          memberIds: getGraspGroupMembers(pieces, groupId).map(
            (member) => member.id
          ),
          adjust: { x: 0, y: 0, ...lead.graspAdjust }
        });
        return;
      }

      setDraft({
        groupId: null,
        leadId: piece.id,
        memberIds: proposeGraspMembers(pieces, piece, gripper),
        adjust: { x: 0, y: 0 }
      });
      return;
    }

    if (piece.id === draft.leadId) {
      return;
    }

    if (groupId !== null && groupId !== draft.groupId) {
      setMessage(t.layer.graspOtherGroup);
      return;
    }

    setDraft((current) => ({
      ...current,
      memberIds: current.memberIds.includes(piece.id)
        ? current.memberIds.filter((id) => id !== piece.id)
        : [...current.memberIds, piece.id]
    }));
  }

  function changeAdjust(axis, value) {
    const numericValue = Number(value);

    setDraft((current) =>
      current
        ? {
            ...current,
            adjust: {
              ...current.adjust,
              [axis]: Number.isFinite(numericValue) ? numericValue : 0
            }
          }
        : current
    );
  }

  function confirmDraft() {
    if (!draft) {
      return;
    }

    if (draft.memberIds.length < 2 && draft.groupId === null) {
      setMessage(t.layer.graspMinPieces);
      return;
    }

    const committed = draft;
    setPieces((currentPieces) => applyGraspGroup(currentPieces, committed));
    setDraft(null);
  }

  function cancelDraft() {
    setDraft(null);
    setMessage(null);
  }

  function dissolveDraft() {
    if (!draft?.groupId) {
      return;
    }

    const { groupId } = draft;
    setPieces((currentPieces) => dissolveGraspGroup(currentPieces, groupId));
    setDraft(null);
  }

  // Intro confirma; Esc descarta la proposta o surt del mode
  useEffect(() => {
    if (!isDefiningGrasps) {
      return;
    }

    function handleKeyDown(event) {
      const target = event.target;
      // Les etiquetes d'ID (només lectura) reben el focus en clicar-les
      const isTyping =
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement) &&
        !target.readOnly;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (draft) {
          cancelDraft();
        } else {
          stopDefiningGrasps();
        }
        return;
      }

      if (event.key === "Enter" && draft && !isTyping) {
        event.preventDefault();
        confirmDraft();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  });

  return {
    isDefiningGrasps,
    graspDraft: draft,
    graspDraftMembers: draftMembers,
    graspDraftEvaluation: draftEvaluation,
    graspMessage: message,
    toggleDefiningGrasps,
    stopDefiningGrasps,
    clickGraspPiece: clickPiece,
    changeGraspAdjust: changeAdjust,
    confirmGraspDraft: confirmDraft,
    cancelGraspDraft: cancelDraft,
    dissolveGraspDraft: dissolveDraft
  };
}
