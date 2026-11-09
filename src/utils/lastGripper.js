/*
  Darrera pinça aplicada, compartida entre projectes:
  un projecte nou comença amb la mateixa pinça (sovint
  és la mateixa per a tot un client).
*/
const LAST_GRIPPER_STORAGE_KEY = "pallet-simulator-last-gripper";

export function getLastGripper() {
  try {
    const savedValue = window.localStorage.getItem(
      LAST_GRIPPER_STORAGE_KEY
    );
    const gripper = savedValue ? JSON.parse(savedValue) : null;

    return gripper && typeof gripper === "object"
      ? { ...gripper }
      : null;
  } catch (error) {
    console.error("No s'ha pogut llegir la darrera pinça:", error);
    return null;
  }
}

export function setLastGripper(gripper) {
  if (!gripper) {
    return;
  }

  try {
    window.localStorage.setItem(
      LAST_GRIPPER_STORAGE_KEY,
      JSON.stringify(gripper)
    );
  } catch (error) {
    console.error("No s'ha pogut desar la darrera pinça:", error);
  }
}
