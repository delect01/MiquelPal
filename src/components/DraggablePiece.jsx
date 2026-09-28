//DraggablePiece

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { getPieceCenter, getReferenceAxes, palletEulerToThreeQuaternion, getReferenceWorldPositionThree } from "../utils/pieceUtils";
import { getPieceLocalVertices } from "../utils/pieceGeometry";

export default function DraggablePiece({
  piece,
  selected,
  colliding,
  outside,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd
}) {



  const isDragging = useRef(false);

  const dragPlane = useMemo(
    () => new THREE.Plane(),
    []
  );

  const intersectionPoint = useMemo(
    () => new THREE.Vector3(),
    []
  );

  const dragOffset = useMemo(
    () => new THREE.Vector3(),
    []
  );



const pieceCenter =
  getPieceCenter(piece);

  const referenceWorldPosition =
  getReferenceWorldPositionThree(
    piece
  );

  const pieceThreeQuaternion =
  palletEulerToThreeQuaternion(
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg
  );

const referenceAxes =
  getReferenceAxes(
    piece,
    true,
    true
  );


  const frameHandedness =
  referenceAxes.tangentX
    .clone()
    .cross(
      referenceAxes.tangentY
    )
    .dot(
      referenceAxes.toolZ
    );

console.log(
  "TCP FRAME CHECK",
  {
    x: referenceAxes.tangentX,
    y: referenceAxes.tangentY,
    z: referenceAxes.toolZ,
    handedness:
      frameHandedness
  }
);

  
const xArrow = useMemo(
  () =>
    new THREE.ArrowHelper(
      referenceAxes.tangentX
        .clone()
        .normalize(),
      new THREE.Vector3(
        0,
        0,
        0
      ),
      300,
      0xff0000
    ),
  [
    piece.referencePoint,
    piece.faceRotationDeg,
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg,
    piece.pieceType,
    piece.width,
    piece.height,
    piece.depth,
    piece.topWidth,
    piece.topDepth
  ]
);

  


const yArrow = useMemo(
  () =>
    new THREE.ArrowHelper(
      referenceAxes.tangentY
        .clone()
        .normalize(),
      new THREE.Vector3(
        0,
        0,
        0
      ),
      300,
      0x00ff00
    ),
  [
    piece.referencePoint,
    piece.faceRotationDeg,
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg,
    piece.pieceType,
    piece.width,
    piece.height,
    piece.depth,
    piece.topWidth,
    piece.topDepth
  ]
);


const zArrow = useMemo(
  () =>
    new THREE.ArrowHelper(
      referenceAxes.toolZ
        .clone()
        .normalize(),
      new THREE.Vector3(
        0,
        0,
        0
      ),
      300,
      0x0000ff
    ),
  [
    piece.referencePoint,
    piece.faceRotationDeg,
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg,
    piece.pieceType,
    piece.width,
    piece.height,
    piece.depth,
    piece.topWidth,
    piece.topDepth
  ]
);





  function handlePointerDown(event) {
    event.stopPropagation();

    onSelect(piece.id);
    onDragStart();

    isDragging.current = true;

    dragPlane.set(
      new THREE.Vector3(0, 1, 0),
      -piece.y
    );

    const intersection = event.ray.intersectPlane(
      dragPlane,
      intersectionPoint
    );

dragOffset.set(
  pieceCenter.x - intersection.x,
  0,
  pieceCenter.z - intersection.z
);

    event.target.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isDragging.current) return;

    event.stopPropagation();

    const intersection = event.ray.intersectPlane(
      dragPlane,
      intersectionPoint
    );

    if (!intersection) return;

    onMove(
      piece.id,
      intersection.x + dragOffset.x,
      intersection.z + dragOffset.z
    );
  }

  function handlePointerUp(event) {
    if (!isDragging.current) return;

    event.stopPropagation();

    isDragging.current = false;

    if (event.target.hasPointerCapture(event.pointerId)) {
      event.target.releasePointerCapture(event.pointerId);
    }

    onDragEnd();
  }



const trapezoidGeometry = useMemo(() => {
  if (
    piece.pieceType !==
    "TRAPEZOIDAL"
  ) {
    return null;
  }

  /*
    Obtenim els mateixos vèrtexs que
    després utilitzaran les col·lisions.
  */
  const localVertices =
    getPieceLocalVertices(piece);

  /*
    BufferGeometry necessita un array pla:

    x1, y1, z1,
    x2, y2, z2...
  */
  const vertices =
    localVertices.flatMap(
      (vertex) => [
        vertex.x,
        vertex.y,
        vertex.z
      ]
    );

  const indices = [
    /*
      Base inferior
    */

    0, 1, 2,
    0, 2, 3,

    /*
      Part superior
    */

    4, 6, 5,
    4, 7, 6,

    /*
      Cara lateral 1
    */

    0, 4, 5,
    0, 5, 1,

    /*
      Cara lateral 2
    */

    1, 5, 6,
    1, 6, 2,

    /*
      Cara lateral 3
    */

    2, 6, 7,
    2, 7, 3,

    /*
      Cara lateral 4
    */

    3, 7, 4,
    3, 4, 0
  ];

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  return geometry;
}, [
  piece.width,
  piece.depth,
  piece.height,
  piece.topWidth,
  piece.topDepth,
  piece.pieceType
]);



return (
  <>

    {/* PEÇA PRINCIPAL */}

    <mesh
      position={[
        pieceCenter.x,
        pieceCenter.y,
        pieceCenter.z
      ]}

      quaternion={[
        pieceThreeQuaternion.x,
        pieceThreeQuaternion.y,
        pieceThreeQuaternion.z,
        pieceThreeQuaternion.w
      ]}

      castShadow
      receiveShadow

      onClick={(event) => {
        event.stopPropagation();
        onSelect(piece.id);
      }}

      onPointerDown={
        handlePointerDown
      }

      onPointerMove={
        handlePointerMove
      }

      onPointerUp={
        handlePointerUp
      }
    >

      {
        piece.pieceType ===
        "TRAPEZOIDAL"
          ? (
              <primitive
                object={
                  trapezoidGeometry
                }
                attach="geometry"
              />
            )
          : (
              <boxGeometry
                args={[
                  piece.width,
                  piece.height,
                  piece.depth
                ]}
              />
            )
      }

      <meshStandardMaterial
        color={
          colliding
            ? "blue"
            : outside
              ? "yellow"
              : selected
                ? "red"
                : "orange"
        }
        roughness={0.65}
        metalness={0}
      />

      <Edges
        threshold={15}
        color={
          colliding
            ? "cyan"
            : selected
              ? "white"
              : "black"
        }
      />

    </mesh>


    {/* BOLA DEL PUNT TCP */}

    <mesh
      position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}
    >

      <sphereGeometry
        args={[
          15,
          16,
          16
        ]}
      />

      <meshStandardMaterial
        color="lime"
      />

    </mesh>


    {/* FLETXA X TCP, VERMELLA */}

    <group
      position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}
    >

      <primitive
        object={xArrow}
      />

    </group>


    {/* FLETXA Y TCP, VERDA */}

    <group
      position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}
    >

      <primitive
        object={yArrow}
      />

    </group>


    {/* FLETXA Z TCP, BLAVA */}

    <group
      position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}
    >

      <primitive
        object={zArrow}
      />

    </group>

  </>
);
  


}