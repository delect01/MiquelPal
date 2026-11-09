import { useMemo } from "react";
import { buildPalletizingLayers } from "../utils/palletizingUtils.js";
import { createPalletizingInstanceId } from "../utils/appModelUtils.js";
import useCollisionGeometryVersion from "./useCollisionGeometryVersion.js";

/*
  Seqüència de paletització: capes desades
  apilades sobre el palet.
*/
export default function usePalletizing({ projectDocument }) {
  const {
    layers,
    palletizingSequence,
    setPalletizingSequence,
    setSelectedPalletizingInstanceId,
    setHasUnsavedChanges
  } = projectDocument;

  // Les capes s'assenten amb la forma real de les peces importades (quan es carrega)
  const collisionGeometryVersion = useCollisionGeometryVersion();

  const palletizedLayerInstances = useMemo(
    () =>
      buildPalletizingLayers(palletizingSequence, layers, collisionGeometryVersion),
    [palletizingSequence, layers, collisionGeometryVersion]
  );

  function addLayerToPalletizing(sourceLayerId) {
    if (
      !layers.some((layer) => layer.id === sourceLayerId)
    ) {
      return;
    }

    const newInstance = {
      instanceId: createPalletizingInstanceId(),
      sourceLayerId
    };

    setPalletizingSequence((currentSequence) => [
      ...currentSequence,
      newInstance
    ]);

    setSelectedPalletizingInstanceId(newInstance.instanceId);
    setHasUnsavedChanges(true);
  }

  function deletePalletizingLayer(instanceId) {
    setPalletizingSequence((currentSequence) =>
      currentSequence.filter(
        (item) => item.instanceId !== instanceId
      )
    );

    setSelectedPalletizingInstanceId((currentSelectedId) =>
      currentSelectedId === instanceId
        ? null
        : currentSelectedId
    );

    setHasUnsavedChanges(true);
  }

  return {
    palletizedLayerInstances,
    addLayerToPalletizing,
    deletePalletizingLayer
  };
}
