import * as THREE from "three";

import {
  palletToThree
} from "./pieceUtils";

export function getPalletCenterPallet(
  pallet
) {
  return {
    x:
      Number(pallet.sizeX) / 2,

    y:
      Number(pallet.sizeY) / 2,

    z:
      -Number(pallet.sizeZ) / 2
  };
}

export function getPalletCenterThree(
  pallet
) {
  const centerPallet =
    getPalletCenterPallet(
      pallet
    );

  return palletToThree(
    centerPallet.x,
    centerPallet.y,
    centerPallet.z
  );
}

export function getPalletSizeThree(
  pallet
) {
  return {
    width:
      Number(pallet.sizeY),

    height:
      Number(pallet.sizeZ),

    depth:
      Number(pallet.sizeX)
  };
}

export function getPalletBoundingBox(
  pallet
) {
  const center =
    getPalletCenterThree(
      pallet
    );

  const size =
    getPalletSizeThree(
      pallet
    );

  return new THREE.Box3()
    .setFromCenterAndSize(
      new THREE.Vector3(
        center.x,
        center.y,
        center.z
      ),
      new THREE.Vector3(
        size.width,
        size.height,
        size.depth
      )
    );
}