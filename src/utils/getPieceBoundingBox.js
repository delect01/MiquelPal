import * as THREE from "three";

import {
  getPieceWorldVertices
} from "./pieceGeometry.js";

import {
  hasImportedConvexGeometry,
  getImportedConvexWorldVertices
} from "./importedConvexGeometry.js";

export function getPieceBoundingBox(piece) {
  /*
    Obtenim els vèrtexs físics reals de
    la peça en coordenades de Three.js.

    Per a les peces importades fem servir la
    forma real, no la capsa width x height x
    depth (que en girar-se és més gran).
  */
  const worldVertices =
    hasImportedConvexGeometry(piece)
      ? getImportedConvexWorldVertices(piece)
      : getPieceWorldVertices(piece);

  /*
    Creem una Box3 que envolta els
    vèrtexs reals.

    Aquesta caixa es farà servir com a
    comprovació ràpida.
  */
  if (
  worldVertices.length === 0
) {
  return new THREE.Box3()
    .makeEmpty();
}

return new THREE.Box3()
  .setFromPoints(
    worldVertices
  );
}