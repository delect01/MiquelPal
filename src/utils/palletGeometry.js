import * as THREE from "three";

import {
  palletToThree
} from "./pieceUtils.js";

import { PALLET_CONFIG } from "../Config/geometryConfig";

const PALLET_LIBRARY_STORAGE_KEY =
  "pallet-simulator-pallet-library";

/*
  Palet amb què comença l'aplicació (i cada projecte
  nou): la plantilla de la biblioteca de palets que es
  diu com el palet predeterminat ("Palet predeterminat").
  Si no n'hi ha cap, el palet predeterminat del codi.
*/
export function getDefaultPallet() {
  try {
    const savedValue = window.localStorage.getItem(
      PALLET_LIBRARY_STORAGE_KEY
    );
    const savedPallets = savedValue ? JSON.parse(savedValue) : [];
    const defaultName = PALLET_CONFIG.name.trim().toLowerCase();

    const savedDefault = Array.isArray(savedPallets)
      ? savedPallets.find(
          (pallet) =>
            String(pallet?.name ?? "").trim().toLowerCase() ===
            defaultName
        )
      : null;

    if (savedDefault) {
      return { ...savedDefault };
    }
  } catch (error) {
    console.error("No s'ha pogut llegir la biblioteca de palets:", error);
  }

  return { ...PALLET_CONFIG };
}

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