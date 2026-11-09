/*
  AGAFADES MÚLTIPLES

  Diverses peces que la pinça agafa i deixa alhora.
  Cada peça continua sent un objecte independent (id
  intern propi), però totes comparteixen:
  - graspGroupId: identificador del grup;
  - orderId: el número d'operació del robot.

  Només la peça guia (graspGroupLead) porta les dades
  de l'agafada:
  - graspAdjust { x, y }: ajust manual del TCP del grup
    (mm, sobre els eixos de l'eina de la peça guia).

  Tot es desa dins les peces: així ho conserven sense
  res més el desfer/refer, les capes, la seqüència de
  paletitzat, l'autodesat i els projectes.
*/

// Color propi de les agafades (ni vermell = selecció, ni blau = col·lisió)
export const GRASP_COLOR = "#7c3aed";

export const GRASP_GROUP_FIELDS = [
  "graspGroupId",
  "graspGroupLead",
  "graspAdjust"
];

export function getGraspGroupId(piece) {
  return piece?.graspGroupId ?? null;
}

export function isInGraspGroup(piece) {
  return getGraspGroupId(piece) !== null;
}

// Peça sense cap dada d'agafada múltiple (agafada individual)
export function withoutGraspGroup(piece) {
  if (!GRASP_GROUP_FIELDS.some((field) => field in piece)) {
    return piece;
  }

  const pieceCopy = { ...piece };
  GRASP_GROUP_FIELDS.forEach((field) => delete pieceCopy[field]);
  return pieceCopy;
}

export function createGraspGroupId() {
  return (
    window.crypto?.randomUUID?.() ??
    `grasp-${Date.now()}-${Math.random()}`
  );
}

/*
  Clau de l'operació del robot a què pertany la peça:
  la del grup o, si és individual, la de la peça.
*/
export function getOperationKey(piece) {
  const groupId = getGraspGroupId(piece);
  return groupId !== null ? `group:${groupId}` : `piece:${piece.id}`;
}

export function getGraspGroupMembers(pieces, groupId) {
  return groupId === null
    ? []
    : pieces.filter((piece) => getGraspGroupId(piece) === groupId);
}

export function getGraspGroupLead(pieces, groupId) {
  const members = getGraspGroupMembers(pieces, groupId);
  return members.find((piece) => piece.graspGroupLead) ?? members[0] ?? null;
}

/*
  Operacions del robot, en l'ordre en què apareix la
  primera peça de cadascuna:
  { key, groupId, lead, pieces }.
*/
export function getOperations(pieces) {
  const operations = [];
  const byKey = new Map();

  pieces.forEach((piece) => {
    const key = getOperationKey(piece);
    let operation = byKey.get(key);

    if (!operation) {
      operation = {
        key,
        groupId: getGraspGroupId(piece),
        lead: null,
        pieces: []
      };
      byKey.set(key, operation);
      operations.push(operation);
    }

    operation.pieces.push(piece);
  });

  operations.forEach((operation) => {
    operation.lead =
      operation.pieces.find((piece) => piece.graspGroupLead) ??
      operation.pieces[0];
  });

  return operations;
}

/*
  Deixa els grups coherents després d'eliminar o
  separar peces:
  - un grup d'una sola peça torna a ser individual;
  - si el grup s'ha quedat sense peça guia, la primera
    que queda passa a ser-ho (sense ajust manual).
  Retorna la mateixa llista si no hi ha res a canviar.
*/
export function cleanupGraspGroups(pieces) {
  const operations = getOperations(pieces);
  const replacements = new Map();

  operations.forEach((operation) => {
    if (operation.groupId === null) {
      return;
    }

    if (operation.pieces.length < 2) {
      operation.pieces.forEach((piece) =>
        replacements.set(piece.id, withoutGraspGroup(piece))
      );
      return;
    }

    const leads = operation.pieces.filter((piece) => piece.graspGroupLead);

    if (leads.length === 1) {
      return;
    }

    const newLead = leads[0] ?? operation.pieces[0];

    operation.pieces.forEach((piece) => {
      const isLead = piece.id === newLead.id;

      if (Boolean(piece.graspGroupLead) === isLead) {
        return;
      }

      const nextPiece = { ...piece, graspGroupLead: isLead };

      if (isLead) {
        nextPiece.graspAdjust = { x: 0, y: 0 };
      } else {
        delete nextPiece.graspAdjust;
      }

      replacements.set(piece.id, nextPiece);
    });
  });

  return replacements.size === 0
    ? pieces
    : pieces.map((piece) => replacements.get(piece.id) ?? piece);
}
