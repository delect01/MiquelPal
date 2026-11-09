import {
  useMemo,
  useRef,
  useState
} from "react";
import {
  Canvas,
  useFrame
} from "@react-three/fiber";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
// Font inclosa al programa: sense ella, Text la baixa d'internet
import viewCubeFontUrl from "../assets/fonts/roboto-latin-700-normal.woff";

const CAMERA_ANIMATION_MS = 280;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const POLE_OFFSET = 0.0001;

/*
  Les vistes TOP i BOTTOM no poden quedar exactament
  alineades amb WORLD_UP. OrbitControls necessita una
  orientacio no degenerada per continuar girant de
  manera estable despres de seleccionar aquestes cares.
*/
const VIEWS = {
  top: new THREE.Vector3(
    0,
    1,
    POLE_OFFSET
  ).normalize(),

  bottom: new THREE.Vector3(
    0,
    -1,
    POLE_OFFSET
  ).normalize(),

  front: new THREE.Vector3(
    0,
    0,
    -1
  ),

  back: new THREE.Vector3(
    0,
    0,
    1
  ),

  left: new THREE.Vector3(
    -1,
    0,
    0
  ),

  right: new THREE.Vector3(
    1,
    0,
    0
  )
};

/*
  Cares del cub en el seu espai local. El cub es dibuixa
  girat Ry(π) respecte de Three.js, per tant en local:
  +Z = +X del robot (davant), +X = +Y del robot
  (esquerra) i +Y = +Z del robot (amunt). Cada etiqueta
  és a la cara que veu la càmera de la seva vista (VIEWS):
  en clicar FRONT, la cara FRONT queda de cara a la
  pantalla.
*/
const FACES = [
  {
    key: "front",
    label: "FRONT",
    position: [0, 0, 0.505],
    rotation: [0, 0, 0]
  },
  {
    key: "back",
    label: "BACK",
    position: [0, 0, -0.505],
    rotation: [0, Math.PI, 0]
  },
  {
    key: "left",
    label: "LEFT",
    position: [0.505, 0, 0],
    rotation: [0, Math.PI / 2, 0]
  },
  {
    key: "right",
    label: "RIGHT",
    position: [-0.505, 0, 0],
    rotation: [0, -Math.PI / 2, 0]
  },
  {
    key: "top",
    label: "TOP",
    position: [0, 0.505, 0],
    // Mig gir en el pla: el text es llegeix bé des de la vista de dalt
    rotation: [-Math.PI / 2, 0, Math.PI]
  },
  {
    key: "bottom",
    label: "BOTTOM",
    position: [0, -0.505, 0],
    rotation: [Math.PI / 2, 0, Math.PI]
  }
];

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(
        -2 * value + 2,
        3
      ) / 2;
}

function getPalletCenter(
  fallbackTarget
) {
  return new THREE.Vector3(
    Number(fallbackTarget?.[0]) || 0,
    Number(fallbackTarget?.[1]) || 0,
    Number(fallbackTarget?.[2]) || 0
  );
}

const COLORS = {
  body: "#f1f5f9",
  face: "#ffffff",
  faceHover: "#dbeafe",
  faceBorder: "#cbd5e1",
  label: "#334155",
  labelHover: "#1d4ed8",
  // Mateixos colors que els eixos de l'escena
  axisX: "#ef4444",
  axisY: "#16a34a",
  axisZ: "#2563eb"
};

/*
  Cara clicable del cub: un panell una mica inserit
  sobre el cos arrodonit, que es ressalta en passar-hi
  el ratolí.
*/
function CubeFace({
  definition,
  onSelect
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={definition.position}
      rotation={definition.rotation}
    >
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(definition.key);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[0.8, 0.8]} />

        <meshStandardMaterial
          color={hovered ? COLORS.faceHover : COLORS.face}
          roughness={0.55}
          metalness={0}
        />
      </mesh>

      <lineSegments
        position={[0, 0, 0.002]}
        raycast={() => null}
      >
        <edgesGeometry args={[FACE_OUTLINE_GEOMETRY]} />
        <lineBasicMaterial color={COLORS.faceBorder} />
      </lineSegments>

      <Text
        font={viewCubeFontUrl}
        position={[0, 0, 0.006]}
        fontSize={0.155}
        letterSpacing={0.04}
        color={hovered ? COLORS.labelHover : COLORS.label}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
        raycast={() => null}
      >
        {definition.label}
      </Text>
    </group>
  );
}

const FACE_OUTLINE_GEOMETRY = new THREE.PlaneGeometry(0.8, 0.8);

/*
  Eix del robot (fletxa amb etiqueta) dibuixat des de la
  cantonada d'origen del cub.
*/
function AxisArrow({ direction, color, label }) {
  const start = AXIS_ORIGIN;
  const end = AXIS_ORIGIN.clone().addScaledVector(direction, AXIS_LENGTH);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction
  );

  return (
    <group raycast={() => null}>
      <mesh
        position={start.clone().lerp(end, 0.5)}
        quaternion={quaternion}
        raycast={() => null}
      >
        <cylinderGeometry args={[0.022, 0.022, AXIS_LENGTH, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh position={end} quaternion={quaternion} raycast={() => null}>
        <coneGeometry args={[0.065, 0.16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* La lletra sempre mira a la càmera */}
      <Billboard position={end.clone().addScaledVector(direction, 0.17)}>
        <Text
          font={viewCubeFontUrl}
          fontSize={0.17}
          color={color}
          anchorX="center"
          anchorY="middle"
          fontWeight={800}
          raycast={() => null}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

/*
  Cantonada d'origen i direccions dels eixos del robot
  dins del cub. El cub es dibuixa girat Ry(π) respecte de
  Three.js (palletToThreeQuaternion), per tant:
  X robot = (0,0,-1) Three → (0,0,1) cub
  Y robot = (-1,0,0) Three → (1,0,0) cub
  Z robot = (0,1,0)  Three → (0,1,0) cub
*/
const AXIS_ORIGIN = new THREE.Vector3(-0.5, -0.5, -0.5);
const AXIS_LENGTH = 1.42;
const ROBOT_AXES = [
  { label: "X", direction: new THREE.Vector3(0, 0, 1), color: COLORS.axisX },
  { label: "Y", direction: new THREE.Vector3(1, 0, 0), color: COLORS.axisY },
  { label: "Z", direction: new THREE.Vector3(0, 1, 0), color: COLORS.axisZ }
];

function OrientationCube({
  cameraRef,
  onSelectView
}) {
  const groupRef = useRef(null);

  const palletToThreeQuaternion =
    useMemo(
      () =>
        new THREE.Quaternion()
          .setFromEuler(
            new THREE.Euler(
              0,
              Math.PI,
              0,
              "XYZ"
            )
          ),
      []
    );

  const desiredQuaternion =
    useMemo(
      () => new THREE.Quaternion(),
      []
    );

  useFrame(() => {
    const mainCamera =
      cameraRef.current;

    const cube =
      groupRef.current;

    if (!mainCamera || !cube) {
      return;
    }

    desiredQuaternion
      .copy(mainCamera.quaternion)
      .invert()
      .multiply(
        palletToThreeQuaternion
      );

    cube.quaternion.copy(
      desiredQuaternion
    );
  });

  return (
    <group ref={groupRef}>
      {/* Cos del cub amb arestes i cantonades arrodonides */}
      <RoundedBox
        args={[1, 1, 1]}
        radius={0.12}
        smoothness={4}
        raycast={() => null}
      >
        <meshStandardMaterial
          color={COLORS.body}
          roughness={0.6}
          metalness={0}
        />
      </RoundedBox>

      {FACES.map((definition) => (
        <CubeFace
          key={definition.key}
          definition={definition}
          onSelect={onSelectView}
        />
      ))}

      {ROBOT_AXES.map((axis) => (
        <AxisArrow key={axis.label} {...axis} />
      ))}
    </group>
  );
}

export default function ViewCube({
  cameraRef,
  controlsRef,
  fallbackTarget = [0, 0, 0]
}) {
  const animationFrameRef =
    useRef(null);

  function stopAnimation() {
    if (
      animationFrameRef.current !==
      null
    ) {
      window.cancelAnimationFrame(
        animationFrameRef.current
      );
    }

    animationFrameRef.current = null;
  }

  function animateToView(viewName) {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const direction = VIEWS[viewName];

    if (!camera || !direction) {
      return;
    }

    stopAnimation();

    /*
      El centre rebut des d'App es sempre la font
      de veritat. No reutilitzem un target antic
      que OrbitControls pugui haver conservat.
    */
    const target = getPalletCenter(
      fallbackTarget
    );

    const startPosition =
      camera.position.clone();

    const distance = Math.max(
      startPosition.distanceTo(target),
      1
    );

    const endPosition =
      target
        .clone()
        .add(
          direction
            .clone()
            .multiplyScalar(distance)
        );

    const startTime =
      performance.now();

    if (controls) {
      controls.enabled = false;
    }

    function animate(currentTime) {
      const rawProgress = Math.min(
        (
          currentTime - startTime
        ) / CAMERA_ANIMATION_MS,
        1
      );

      const progress =
        easeInOutCubic(
          rawProgress
        );

      camera.position.lerpVectors(
        startPosition,
        endPosition,
        progress
      );

      /*
        WORLD_UP queda fix durant tota l'animacio.
        No interpol·lem camera.up ni quaternion.
      */
      camera.up.copy(WORLD_UP);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);

      if (rawProgress < 1) {
        animationFrameRef.current =
          window.requestAnimationFrame(
            animate
          );

        return;
      }

      camera.position.copy(
        endPosition
      );

      camera.up.copy(WORLD_UP);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);

      if (controls) {
        controls.target.copy(target);
        controls.update();
        controls.enabled = true;
      }

      animationFrameRef.current = null;
    }

    animationFrameRef.current =
      window.requestAnimationFrame(
        animate
      );
  }

  return (
    <div
      aria-label="Control d'orientacio 3D"
      style={{
        position: "absolute",
        right: "14px",
        bottom: "14px",
        width: "124px",
        height: "124px",
        zIndex: 20,
        userSelect: "none",
        touchAction: "none",
        cursor: "pointer",
        /*
          Sense cercle que retalli: el cub i els eixos es
          veuen sencers, amb una ombra suau.
        */
        filter: "drop-shadow(0 4px 10px rgba(15, 23, 42, 0.22))"
      }}
    >
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 4],
          zoom: 44,
          near: 0.1,
          far: 20
        }}
        gl={{
          alpha: true,
          antialias: true
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent"
        }}
      >
        <ambientLight intensity={1.6} />

        <directionalLight
          position={[2, 3, 4]}
          intensity={1.1}
        />

        <directionalLight
          position={[-3, -2, 2]}
          intensity={0.35}
        />

        <OrientationCube
          cameraRef={cameraRef}
          onSelectView={animateToView}
        />
      </Canvas>
    </div>
  );
}


