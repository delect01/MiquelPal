import { useSyncExternalStore } from "react";
import {
  subscribeCollisionGeometry,
  getCollisionGeometryVersion
} from "../utils/collisionGeometryStore.js";

/*
  Número que canvia cada vegada que s'acaba de calcular
  el volum de col·lisió d'un model importat. Els
  components que en depenen el fan servir per tornar-se
  a dibuixar (col·lisions, cares, TCP de cinta).
*/
export default function useCollisionGeometryVersion() {
  return useSyncExternalStore(
    subscribeCollisionGeometry,
    getCollisionGeometryVersion
  );
}
