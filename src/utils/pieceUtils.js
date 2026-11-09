import * as THREE from "three";
import {
  getImportedFaceCenterPallet,
  getImportedFaceNormalPallet,
  isImportedFaceReference
} from "./importedFaceUtils.js";

export function palletToThree(
  x,
  y,
  z
) {
  return {
    x: -y,
    y:  z,
    z: -x
  };
}

export function threeToPallet(
  x,
  y,
  z
) {
  return {
    x: -z,
    y: -x,
    z:  y
  };
}

export function palletVectorToThree(
  vector
) {

  return new THREE.Vector3(

    -vector.y,

     vector.z,

    -vector.x

  );

}


export function palletEulerToThreeQuaternion(
  rxDeg,
  ryDeg,
  rzDeg
) {

  const palletQuaternion =
    new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(
            Number(rxDeg ?? 0)
          ),
          THREE.MathUtils.degToRad(
            Number(ryDeg ?? 0)
          ),
          THREE.MathUtils.degToRad(
            Number(rzDeg ?? 0)
          ),
          "XYZ"
        )
      );

  return palletQuaternionToThree(
    palletQuaternion
  );
}

/*
  Converteix una orientació expressada en un frame
  de robot (X endavant, Y esquerra, Z amunt: palet o
  cinta) al sistema de Three.js.

  És la mateixa conjugació per la matriu base que
  utilitza palletEulerToThreeQuaternion.
*/
/*
  Rotació que porta els eixos d'un frame de robot
  (X endavant, Y esquerra, Z amunt) als de Three.js:
  és la mateixa base que palletVectorToThree.

  Un grup de Three.js amb aquesta rotació permet
  dibuixar a dins directament en coordenades de robot.
*/
export function getPalletToThreeBasisQuaternion() {
  const basisMatrix =
    new THREE.Matrix4()
      .makeBasis(
        new THREE.Vector3(
          0,
          0,
          -1
        ),
        new THREE.Vector3(
          -1,
          0,
          0
        ),
        new THREE.Vector3(
          0,
          1,
          0
        )
      );

  const basisQuaternion =
    new THREE.Quaternion()
      .setFromRotationMatrix(
        basisMatrix
      )
      .normalize();

  return basisQuaternion;
}

export function palletQuaternionToThree(
  palletQuaternion
) {
  const basisQuaternion =
    getPalletToThreeBasisQuaternion();

  return basisQuaternion
    .clone()
    .multiply(
      palletQuaternion
    )
    .multiply(
      basisQuaternion
        .clone()
        .invert()
    )
    .normalize();
}

/*
  Angles del robot a partir d'un quaternion expressat
  en un frame de robot: convenció ZYX, en graus,
  normalitzats a [0, 360).

  És la mateixa descomposició que getReferenceWorldEuler.
*/
export function quaternionToRobotEuler(quaternion) {
  const euler = new THREE.Euler(0, 0, 0, "ZYX");

  euler.setFromQuaternion(quaternion, "ZYX");

  const normalizeDegrees = (radians) => {
    let normalized = THREE.MathUtils.euclideanModulo(
      THREE.MathUtils.radToDeg(radians),
      360
    );

    if (
      Math.abs(normalized) < 1e-8 ||
      Math.abs(normalized - 360) < 1e-8
    ) {
      normalized = 0;
    }

    return normalized;
  };

  return {
    rx: normalizeDegrees(euler.x),
    ry: normalizeDegrees(euler.y),
    rz: normalizeDegrees(euler.z)
  };
}











//import { getReferenceOffset } from "./pieceUtils.js";
export function getPieceSize(piece) {
  return {
    width: piece.width,
    height: piece.height,
    depth: piece.depth
  };
}

export function getPieceHalfSize(piece) {
  return {
    halfWidth: piece.width / 2,
    halfHeight: piece.height / 2,
    halfDepth: piece.depth / 2
  };
}

export function getPieceCenter(piece) {

  return palletToThree(

    piece.x,

    piece.y,

    piece.z

  );

}


export function getPieceReferencePoint(piece) {
  return piece.referencePoint;
}

function getFaceCenterPallet(
  piece,
  face
) {
  if (
    piece.pieceType ===
      "IMPORTED_3D" &&
    isImportedFaceReference(
      face
    )
  ) {
    const importedCenter =
      getImportedFaceCenterPallet(
        piece,
        face
      );

    if (importedCenter) {
      return importedCenter;
    }
  }

  const width =
    Number(piece.width);


  const height =
    Number(piece.height);

  const depth =
    Number(piece.depth);

  const topWidth =
    piece.pieceType === "TRAPEZOIDAL"
      ? Number(
          piece.topWidth ??
          piece.width
        )
      : width;

  const topDepth =
    piece.pieceType === "TRAPEZOIDAL"
      ? Number(
          piece.topDepth ??
          piece.depth
        )
      : depth;

  /*
    Per les cares inclinades del trapezi,
    el centre lateral és la mitjana entre
    la semidimensió inferior i superior.
  */

  const frontBackDistance =
    (depth + topDepth) / 4;

  const leftRightDistance =
    (width + topWidth) / 4;

  switch (face) {

    case "CENTER":
      return new THREE.Vector3(
        0,
        0,
        0
      );

    case "FRONT_CENTER":
      return new THREE.Vector3(
        frontBackDistance,
        0,
        0
      );

    case "BACK_CENTER":
      return new THREE.Vector3(
        -frontBackDistance,
        0,
        0
      );

    case "LEFT_CENTER":
      return new THREE.Vector3(
        0,
        leftRightDistance,
        0
      );

    case "RIGHT_CENTER":
      return new THREE.Vector3(
        0,
        -leftRightDistance,
        0
      );

    case "TOP_CENTER":
      return new THREE.Vector3(
        0,
        0,
        height / 2
      );

    case "BOTTOM_CENTER":
      return new THREE.Vector3(
        0,
        0,
        -height / 2
      );

    default:
      return new THREE.Vector3(
        0,
        0,
        0
      );

  }

}




export function getReferenceOffset(
  piece
) {

  const localOffset =
    getFaceCenterPallet(
      piece,
      piece.referencePoint
    );

  /*
    Eixos locals de la cara.
    Sense rotació global de la peça.
    Sense FaceRotation per als offsets.
  */
  const faceAxes =
    getReferenceAxesPallet(
      piece,
      false,
      false
    );

  const faceOffsetX =
    Number(
      piece.faceOffsetX ?? 0
    );

  const faceOffsetY =
    Number(
      piece.faceOffsetY ?? 0
    );

  localOffset.add(
    faceAxes.tangentX
      .clone()
      .multiplyScalar(
        faceOffsetX
      )
  );

  localOffset.add(
    faceAxes.tangentY
      .clone()
      .multiplyScalar(
        faceOffsetY
      )
  );

  return localOffset;

}

export function getRotatedReferenceOffset(
  piece
) {

  const localOffset =
    getReferenceOffset(
      piece
    ).clone();

  /*
    Rotació absoluta expressada
    en WORLD pallet.
  */
  const pieceQuaternion =
    new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(
            Number(piece.rxDeg ?? 0)
          ),
          THREE.MathUtils.degToRad(
            Number(piece.ryDeg ?? 0)
          ),
          THREE.MathUtils.degToRad(
            Number(piece.rzDeg ?? 0)
          ),
          "XYZ"
        )
      );

  localOffset.applyQuaternion(
    pieceQuaternion
  );

  return localOffset;

}

export function getReferenceWorldPositionThree(
  piece
) {

  /*
    Offset del punt de referència,
    ja rotat amb RX/RY/RZ,
    en WORLD pallet.
  */
  const rotatedOffset =
    getRotatedReferenceOffset(
      piece
    );

  /*
    Posició absoluta del TCP
    en WORLD pallet.
  */
  const worldPalletPosition =
  new THREE.Vector3(

      Number(piece.x) +
      rotatedOffset.x,

      Number(piece.y) +
      rotatedOffset.y,

      Number(piece.z) +
      rotatedOffset.z

    );

  /*
    Conversió única al sistema Three.js.
  */
  return palletVectorToThree(
    worldPalletPosition
  );

}



export function getReferencePointPosition(
  piece
) {

  const palletOffset =
    getReferenceOffset(
      piece
    );

  return palletVectorToThree(
    palletOffset
  );

}

export function changeReferencePoint(
  piece,
  newReferencePoint
) {

  const oldOffset =
    getRotatedReferenceOffset(
      piece
    );

  const updatedPiece = {
    ...piece,
    referencePoint:
      newReferencePoint
  };

  const newOffset =
    getRotatedReferenceOffset(
      updatedPiece
    );

  return {

    ...updatedPiece,

    x:
      Number(piece.x) +
      oldOffset.x -
      newOffset.x,

    y:
      Number(piece.y) +
      oldOffset.y -
      newOffset.y,

    z:
      Number(piece.z) +
      oldOffset.z -
      newOffset.z

  };

}


export function getDisplayedCoordinates(
  piece
) {

  const offset =
    getRotatedReferenceOffset(
      piece
    );

  return {

    x:
      Number(piece.x) +
      offset.x,

    y:
      Number(piece.y) +
      offset.y,

    z:
      Number(piece.z) +
      offset.z

  };

}

export function displayedToCenterCoordinates(
  piece,
  displayedX,
  displayedY,
  displayedZ
) {

  const offset =
    getRotatedReferenceOffset(
      piece
    );

  return {

    x:
      Number(displayedX) -
      offset.x,

    y:
      Number(displayedY) -
      offset.y,

    z:
      Number(displayedZ) -
      offset.z

  };

}






export function getReferenceNormal(
  piece
) {
  if (
    piece.pieceType ===
      "IMPORTED_3D" &&
    isImportedFaceReference(
      piece.referencePoint
    )
  ) {
    const importedNormal =
      getImportedFaceNormalPallet(
        piece,
        piece.referencePoint
      );

    if (importedNormal) {
      return {
        x: importedNormal.x,
        y: importedNormal.y,
        z: importedNormal.z
      };
    }
  }

  const width =
    Number(piece.width);

  const height =
    Number(piece.height);

  const depth =
    Number(piece.depth);

  const topWidth =
    piece.pieceType === "TRAPEZOIDAL"
      ? Number(
          piece.topWidth ??
          piece.width
        )
      : width;

  const topDepth =
    piece.pieceType === "TRAPEZOIDAL"
      ? Number(
          piece.topDepth ??
          piece.depth
        )
      : depth;

  const widthDelta =
    (width - topWidth) / 2;

  const depthDelta =
    (depth - topDepth) / 2;

  /*
    Totes les normals estan expressades
    en WORLD pallet:

    X = endavant
    Y = esquerra
    Z = amunt
  */

  switch (piece.referencePoint) {

    case "FRONT_CENTER":
      return {
        x: height,
        y: 0,
        z: depthDelta
      };

    case "BACK_CENTER":
      return {
        x: -height,
        y: 0,
        z: depthDelta
      };

    case "LEFT_CENTER":
      return {
        x: 0,
        y: height,
        z: widthDelta
      };

    case "RIGHT_CENTER":
      return {
        x: 0,
        y: -height,
        z: widthDelta
      };

    case "TOP_CENTER":
      return {
        x: 0,
        y: 0,
        z: 1
      };

    case "BOTTOM_CENTER":
      return {
        x: 0,
        y: 0,
        z: -1
      };

    case "CENTER":
    default:
      return {
        x: 0,
        y: 0,
        z: 1
      };

  }

}

export function getReferenceQuaternion(
  piece
) {

  const axes =
    getReferenceAxesPallet(
      piece,
      true,
      true
    );

  const rotationMatrix =
    new THREE.Matrix4();

  rotationMatrix.makeBasis(
    axes.tangentX.clone().normalize(),
    axes.tangentY.clone().normalize(),
    axes.toolZ.clone().normalize()
  );

  const quaternion =
    new THREE.Quaternion();

  quaternion.setFromRotationMatrix(
    rotationMatrix
  );

  return quaternion.normalize();

}



export function getReferenceQuaternionFromAxes(
  piece
) {

  return getReferenceQuaternion(
    piece
  );

}




export function getReferenceWorldEuler(
  piece
) {
  /*
    El quaternion representa el frame final
    expressat en WORLD pallet. El robot el descompon
    en ZYX (vegeu quaternionToRobotEuler).
  */
  return quaternionToRobotEuler(
    getReferenceQuaternion(
      piece
    )
  );
}

export function getReferenceRobotEuler(
  piece
) {

  return getReferenceWorldEuler(
    piece
  );

}





export function getReferenceAxes(
  piece,
  applyFaceRotation = true,
  applyPieceRotation = false
) {

  const palletAxes =
    getReferenceAxesPallet(
      piece,
      applyFaceRotation,
      applyPieceRotation
    );

  return {

    tangentX:
      palletVectorToThree(
        palletAxes.tangentX
      ).normalize(),

    tangentY:
      palletVectorToThree(
        palletAxes.tangentY
      ).normalize(),

    toolZ:
      palletVectorToThree(
        palletAxes.toolZ
      ).normalize()

  };

}


export function getReferenceAxesPallet(
  piece,
  applyFaceRotation = true,
  applyPieceRotation = true
) {


  /*
    Normal geomètrica de la cara,
    expressada en WORLD pallet.
  */
  const faceNormalData =
    getReferenceNormal(piece);

  const faceNormal =
    new THREE.Vector3(
      faceNormalData.x,
      faceNormalData.y,
      faceNormalData.z
    ).normalize();

  /*
    La Z del TCP apunta cap al material,
    per tant és la normal invertida.
  */
  const toolZ =
    faceNormal
      .clone()
      .multiplyScalar(-1);

  const palletUp =
    new THREE.Vector3(
      0,
      0,
      1
    );

  const palletForward =
    new THREE.Vector3(
      1,
      0,
      0
    );

  let tangentX;

  /*
    Si toolZ és vertical, no podem utilitzar
    palletUp com a tangentX perquè serien
    vectors paral·lels.

    En TOP/BOTTOM utilitzem +X pallet.
  */
  if (
    Math.abs(
      toolZ.dot(palletUp)
    ) > 0.999
  ) {

    tangentX =
      palletForward.clone();

  } else {

    /*
      A FRONT/BACK/LEFT/RIGHT,
      la vermella apunta preferentment amunt.
    */
    tangentX =
      palletUp.clone();

  }

  /*
    Projectem tangentX sobre el pla
    perpendicular a toolZ.
  */
  tangentX.add(
    toolZ
      .clone()
      .multiplyScalar(
        -tangentX.dot(toolZ)
      )
  );

  tangentX.normalize();

  /*
    Regla de la mà dreta:

    Y = Z × X
  */
  let tangentY =
    new THREE.Vector3()
      .crossVectors(
        toolZ,
        tangentX
      )
      .normalize();

  /*
    Tornem a calcular X per assegurar
    ortogonalitat perfecta:

    X = Y × Z
  */
  tangentX =
    new THREE.Vector3()
      .crossVectors(
        tangentY,
        toolZ
      )
      .normalize();

  /*
    Rotació manual de la cara.
    Gira X i Y al voltant de la Z del TCP.
  */
  if (applyFaceRotation) {

    const faceRotationRad =
      THREE.MathUtils.degToRad(
        Number(
          piece.faceRotationDeg ?? 0
        )
      );

    const faceRotationQuaternion =
      new THREE.Quaternion()
        .setFromAxisAngle(
          toolZ,
          faceRotationRad
        );

    tangentX.applyQuaternion(
      faceRotationQuaternion
    );

    tangentY.applyQuaternion(
      faceRotationQuaternion
    );

  }

  /*
    Rotació absoluta de la peça respecte
    al WORLD pallet.
  */
  if (applyPieceRotation) {

  /*
    Matriu del frame de la cara,
    incloent FaceRotation.
  */
  const faceMatrix =
    new THREE.Matrix4();

  faceMatrix.makeBasis(
    tangentX.clone().normalize(),
    tangentY.clone().normalize(),
    toolZ.clone().normalize()
  );

  /*
    Rotació manual RX/RY/RZ
    expressada respecte al frame pallet.
  */
  const pieceEuler =
    new THREE.Euler(
      THREE.MathUtils.degToRad(
        Number(piece.rxDeg ?? 0)
      ),
      THREE.MathUtils.degToRad(
        Number(piece.ryDeg ?? 0)
      ),
      THREE.MathUtils.degToRad(
        Number(piece.rzDeg ?? 0)
      ),
      "XYZ"
    );

  const pieceRotationMatrix =
    new THREE.Matrix4()
      .makeRotationFromEuler(
        pieceEuler
      );

  /*
    Composició local:

    frame final =
    frame cara × rotació introduïda
  */
 const finalMatrix =
  pieceRotationMatrix
    .clone()
    .multiply(
      faceMatrix
    );

  tangentX =
    new THREE.Vector3();

  tangentY =
    new THREE.Vector3();

  const finalToolZ =
    new THREE.Vector3();

  finalMatrix.extractBasis(
    tangentX,
    tangentY,
    finalToolZ
  );

  toolZ.copy(
    finalToolZ
  );

}

  /*
    Neteja numèrica final.
  */
  tangentX.normalize();
  tangentY.normalize();
  toolZ.normalize();

  return {

    tangentX,

    tangentY,

    toolZ

  };

}




