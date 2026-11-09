import {
  useMemo
} from "react";

import * as THREE from "three";

import {
  palletToThree
} from "../utils/pieceUtils.js";

export default function PalletWorldAxes({
  length = 250
}) {
  /*
    Origen WORLD del palet convertit
    a coordenades de Three.js.
  */
  const palletOriginThree =
    useMemo(
     () =>
        palletToThree(
          0,
          0,
          0
        ),
      []
    );

  /*
    Calculem tres punts situats sobre
    els eixos positius del WORLD del
    palet.

    No assumim manualment quina direcció
    correspon a cada eix de Three.js.
  */
  const palletXAxisPointThree =
    useMemo(
      () =>
        palletToThree(
          1,
          0,
          0
        ),
      []
    );

  const palletYAxisPointThree =
    useMemo(
      () =>
        palletToThree(
          0,
          1,
          0
        ),
      []
    );

  const palletZAxisPointThree =
    useMemo(
      () =>
        palletToThree(
          0,
          0,
          1
        ),
      []
    );

  /*
    Direcció X WORLD del palet,
    expressada en coordenades Three.js.
  */
  const palletXDirection =
    useMemo(
      () =>
        new THREE.Vector3(
          palletXAxisPointThree.x -
            palletOriginThree.x,

          palletXAxisPointThree.y -
            palletOriginThree.y,

          palletXAxisPointThree.z -
            palletOriginThree.z
        ).normalize(),
      [
        palletOriginThree,
        palletXAxisPointThree
      ]
    );

  /*
    Direcció Y WORLD del palet,
    expressada en coordenades Three.js.
  */
  const palletYDirection =
    useMemo(
      () =>
        new THREE.Vector3(
          palletYAxisPointThree.x -
            palletOriginThree.x,

          palletYAxisPointThree.y -
            palletOriginThree.y,

          palletYAxisPointThree.z -
            palletOriginThree.z
        ).normalize(),
      [
        palletOriginThree,
        palletYAxisPointThree
      ]
    );

  /*
    Direcció Z WORLD del palet,
    expressada en coordenades Three.js.
  */
  const palletZDirection =
    useMemo(
      () =>
        new THREE.Vector3(
          palletZAxisPointThree.x -
            palletOriginThree.x,

          palletZAxisPointThree.y -
            palletOriginThree.y,

          palletZAxisPointThree.z -
            palletOriginThree.z
        ).normalize(),
      [
        palletOriginThree,
        palletZAxisPointThree
      ]
    );

  /*
    Creem les tres fletxes.

    X = vermella
    Y = verda
    Z = blava
  */
  const xArrow =
    useMemo(
      () =>
        new THREE.ArrowHelper(
          palletXDirection,
          new THREE.Vector3(
            0,
            0,
            0
          ),
          length,
          0xff0000,
          35,
          12
        ),
      [
        palletXDirection,
        length
      ]
    );

  const yArrow =
    useMemo(
      () =>
        new THREE.ArrowHelper(
          palletYDirection,
          new THREE.Vector3(
            0,
            0,
            0
          ),
          length,
          0x00aa00,
          35,
          12
        ),
      [
        palletYDirection,
        length
      ]
    );

  const zArrow =
    useMemo(
      () =>
        new THREE.ArrowHelper(
          palletZDirection,
          new THREE.Vector3(
            0,
            0,
            0
          ),
          length,
          0x0000ff,
          35,
          12
        ),
      [
        palletZDirection,
        length
      ]
    );

  return (
    <group
      position={[
        palletOriginThree.x,
        palletOriginThree.y,
        palletOriginThree.z
      ]}
    >
      {/*
        Bola blanca a l'origen WORLD
        del palet.
      */}
      <mesh>
        <sphereGeometry
          args={[
            12,
            16,
            16
          ]}
        />

        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
        />
      </mesh>

      {/*
        Eix X WORLD del palet.
      */}
      <primitive
        object={xArrow}
      />

      {/*
        Eix Y WORLD del palet.
      */}
      <primitive
        object={yArrow}
      />

      {/*
        Eix Z WORLD del palet.
      */}
      <primitive
        object={zArrow}
      />
    </group>
  );
}