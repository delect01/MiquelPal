import * as THREE from "three";

/*
  Matriu de la pinça a partir de la pose del TCP:
  aplica la rotació "robot front" al voltant de la
  Z de l'eina.
*/
export function buildGripperTargetMatrix(gripper, position, toolQuaternion) {
  const robotFront = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    THREE.MathUtils.degToRad(Number(gripper.robotFrontDeg) || 0)
  );
  const quaternion = toolQuaternion.clone().multiply(robotFront).normalize();
  return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1));
}
