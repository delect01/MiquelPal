import { useEffect, useMemo, useRef } from "react";

/*
  Referències compartides de l'escena 3D i punt
  on mira la càmera (centre del palet).
*/
export default function useSceneCamera(palletHeight) {
  const sceneCameraRef = useRef(null);
  const orbitControlsRef = useRef(null);
  const canvasElementRef = useRef(null);

  const orbitTarget = useMemo(
    () => [0, -Number(palletHeight) / 2, 0],
    [palletHeight]
  );

  useEffect(() => {
    const controls = orbitControlsRef.current;

    if (!controls) {
      return;
    }

    /*
      OrbitControls conserva internament el target.
      Actualitzar només la prop no sempre substitueix
      el valor intern després de canvis de projecte,
      palet o ViewCube.
    */
    controls.target.set(
      Number(orbitTarget[0]) || 0,
      Number(orbitTarget[1]) || 0,
      Number(orbitTarget[2]) || 0
    );

    controls.update();
  }, [orbitTarget]);

  return {
    sceneCameraRef,
    orbitControlsRef,
    canvasElementRef,
    orbitTarget
  };
}
