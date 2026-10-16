import {
  useMemo,
  useRef
} from "react";
import {
  Canvas,
  useFrame
} from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

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

const FACES = [
  {
    key: "front",
    label: "FRONT",
    position: [0, 0, -0.505],
    rotation: [0, Math.PI, 0]
  },
  {
    key: "back",
    label: "BACK",
    position: [0, 0, 0.505],
    rotation: [0, 0, 0]
  },
  {
    key: "left",
    label: "LEFT",
    position: [-0.505, 0, 0],
    rotation: [0, -Math.PI / 2, 0]
  },
  {
    key: "right",
    label: "RIGHT",
    position: [0.505, 0, 0],
    rotation: [0, Math.PI / 2, 0]
  },
  {
    key: "top",
    label: "TOP",
    position: [0, 0.505, 0],
    rotation: [-Math.PI / 2, 0, 0]
  },
  {
    key: "bottom",
    label: "BOTTOM",
    position: [0, -0.505, 0],
    rotation: [Math.PI / 2, 0, 0]
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

function CubeFace({
  definition,
  onSelect
}) {
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
      >
        <planeGeometry
          args={[0.98, 0.98]}
        />

        <meshStandardMaterial
          color="#f4f7f9"
          roughness={0.78}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments
        position={[0, 0, 0.004]}
        raycast={() => null}
      >
        <edgesGeometry
          args={[
            new THREE.PlaneGeometry(
              0.98,
              0.98
            )
          ]}
        />

        <lineBasicMaterial
          color="#4e5862"
        />
      </lineSegments>

      <Text
  position={[0, 0, 0.012]}
  rotation={[
    0,
    0,
    0
  ]}
  fontSize={0.19}
  color="#303840"
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
      {FACES.map((definition) => (
        <CubeFace
          key={definition.key}
          definition={definition}
          onSelect={onSelectView}
        />
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
        right: "18px",
        bottom: "18px",
        width: "92px",
        height: "92px",
        zIndex: 20,
        overflow: "hidden",
        borderRadius: "46px",
        border:
          "1px solid rgba(95, 105, 115, 0.30)",
        background:
          "rgba(255, 255, 255, 0.86)",
        boxShadow:
          "0 6px 18px rgba(0, 0, 0, 0.16)",
        backdropFilter: "blur(5px)",
        userSelect: "none",
        touchAction: "none",
        cursor: "pointer"
      }}
    >
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 4],
          zoom: 62,
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
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[3, 4, 5]}
          intensity={1.2}
        />

        <OrientationCube
          cameraRef={cameraRef}
          onSelectView={animateToView}
        />
      </Canvas>
    </div>
  );
}


