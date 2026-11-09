import {
  cleanupGraspGroups,
  createGraspGroupId,
  getGraspGroupId,
  getOperationKey,
  getOperations,
  withoutGraspGroup
} from "./graspGroups.js";
import { getOperationOrderId } from "./orderIdUtils.js";

/*
  Renumera les operacions de l'1 a N segons una clau
  d'ordre (número d'operació, o una posició provisional
  entre dues operacions). Les operacions sense número
  van al final, en l'ordre actual.
*/
function renumberOperations(pieces, provisionalKeys = new Map()) {
  const operations = getOperations(pieces).map((operation, index) => {
    const provisional = provisionalKeys.get(operation.key);
    const orderId = getOperationOrderId(operation);

    return {
      key: operation.key,
      sortKey:
        provisional ?? (orderId === null ? Infinity : orderId),
      index
    };
  });

  operations.sort(
    (first, second) =>
      first.sortKey - second.sortKey || first.index - second.index
  );

  const orderIdByKey = new Map(
    operations.map((operation, index) => [operation.key, index + 1])
  );

  return pieces.map((piece) => ({
    ...piece,
    orderId: orderIdByKey.get(getOperationKey(piece))
  }));
}

function getPieceOperationOrderId(pieces, piece) {
  const key = getOperationKey(piece);
  const operation = getOperations(pieces).find((item) => item.key === key);
  return operation ? getOperationOrderId(operation) : null;
}

/*
  Les peces que surten d'una agafada continuen just
  després d'ella, en el mateix ordre.
*/
function getAfterBaseKey(baseOrderId, position) {
  return baseOrderId === null
    ? Infinity
    : baseOrderId + 0.5 + position * 0.001;
}

/*
  Crea o actualitza una agafada múltiple:
  - totes les peces reben el número d'operació que
    tenia la peça guia;
  - les que en surten passen a ser individuals just
    després;
  - la resta d'operacions es renumeren sense forats.

  Amb menys de dues peces no hi ha agafada múltiple: si
  se n'editava una, es desfà.
*/
export function applyGraspGroup(
  pieces,
  { groupId = null, leadId, memberIds, adjust = { x: 0, y: 0 } }
) {
  const lead = pieces.find((piece) => piece.id === leadId);

  if (!lead) {
    return pieces;
  }

  const memberIdSet = new Set(memberIds);
  memberIdSet.add(leadId);

  if (memberIdSet.size < 2) {
    return groupId ? dissolveGraspGroup(pieces, groupId) : pieces;
  }

  const finalGroupId = groupId ?? createGraspGroupId();
  const baseOrderId = getPieceOperationOrderId(pieces, lead);

  const provisionalKeys = new Map();
  let removedPosition = 0;

  const nextPieces = pieces.map((piece) => {
    if (memberIdSet.has(piece.id)) {
      const isLead = piece.id === leadId;

      return {
        ...withoutGraspGroup(piece),
        graspGroupId: finalGroupId,
        graspGroupLead: isLead,
        ...(isLead
          ? {
              graspAdjust: {
                x: Number(adjust?.x) || 0,
                y: Number(adjust?.y) || 0
              }
            }
          : {}),
        orderId: baseOrderId
      };
    }

    // Era de l'agafada que s'edita i se n'ha tret
    if (groupId !== null && getGraspGroupId(piece) === groupId) {
      const individual = withoutGraspGroup(piece);
      provisionalKeys.set(
        getOperationKey(individual),
        getAfterBaseKey(baseOrderId, removedPosition)
      );
      removedPosition += 1;
      return individual;
    }

    return piece;
  });

  if (baseOrderId !== null) {
    provisionalKeys.set(`group:${finalGroupId}`, baseOrderId);
  }

  // Si una peça venia d'una altra agafada, aquella es revisa
  return renumberOperations(cleanupGraspGroups(nextPieces), provisionalKeys);
}

/*
  Desfà una agafada múltiple: cada peça torna a ser una
  operació individual. La guia es queda el número de
  l'agafada i la resta la segueixen.
*/
export function dissolveGraspGroup(pieces, groupId) {
  const members = pieces.filter(
    (piece) => getGraspGroupId(piece) === groupId
  );

  if (members.length === 0) {
    return pieces;
  }

  const lead = members.find((piece) => piece.graspGroupLead) ?? members[0];
  const baseOrderId = getPieceOperationOrderId(pieces, lead);
  const orderedMembers = [lead, ...members.filter((piece) => piece !== lead)];

  const provisionalKeys = new Map();
  orderedMembers.forEach((piece, position) => {
    provisionalKeys.set(
      `piece:${piece.id}`,
      position === 0 && baseOrderId !== null
        ? baseOrderId
        : getAfterBaseKey(baseOrderId, position)
    );
  });

  const nextPieces = pieces.map((piece) =>
    getGraspGroupId(piece) === groupId ? withoutGraspGroup(piece) : piece
  );

  return renumberOperations(nextPieces, provisionalKeys);
}
