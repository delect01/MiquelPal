import { useMemo, useState } from "react";
import {
  ensureOrderIds,
  cloneLayerPieces,
  getLayerPiecesSignature,
  createLayerId,
  areGripperOffsetsEqual
} from "../utils/appModelUtils.js";
import {
  getOrderIdValidation,
  createOrderIdErrorMessage
} from "../utils/orderIdUtils.js";
import { getGraspGroupId } from "../utils/graspGroups.js";
import useOrderIdDefinition from "./useOrderIdDefinition.js";

const CLOSED_ORDER_ID_ERROR = {
  open: false,
  message: ""
};

/*
  Capes desades: crear, guardar, canviar d'una a
  l'altra (avisant si hi ha canvis sense desar) i
  eliminar.
*/
export default function useLayers({
  projectDocument,
  clearPieceSelection,
  currentLayerGripperOffsets,
  loadLayerGripperOffsets,
  openConfirmDialog,
  t
}) {
  const {
    pieces,
    setPieces,
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    layerName,
    setLayerName,
    setPalletizingSequence,
    setHasUnsavedChanges,
    suppressNextChangeDetectionRef
  } = projectDocument;

  /*
    Capa que s'ha demanat obrir mentre la capa
    actual tenia canvis sense desar.
  */
  const [pendingLayerId, setPendingLayerId] =
    useState(null);
  const [isPendingNewLayer, setIsPendingNewLayer] =
    useState(false);
  const [
    isUnsavedLayerDialogOpen,
    setIsUnsavedLayerDialogOpen
  ] = useState(false);

  const [orderIdErrorDialog, setOrderIdErrorDialog] =
    useState(CLOSED_ORDER_ID_ERROR);
  const [showOrderIds, setShowOrderIds] = useState(false);

  const orderIdDefinition = useOrderIdDefinition({
    pieces,
    setPieces,
    onStart: () => {
      clearPieceSelection();
      setShowOrderIds(true);
    },
    openConfirmDialog,
    t
  });

  const activeLayer =
    layers.find((layer) => layer.id === activeLayerId) ??
    null;

  // Peces o offsets genèrics diferents dels de la capa desada
  const isCurrentLayerDirty = activeLayer
    ? getLayerPiecesSignature(pieces) !==
        getLayerPiecesSignature(activeLayer.pieces) ||
      !areGripperOffsetsEqual(
        currentLayerGripperOffsets,
        activeLayer.gripperOffsets
      )
    : pieces.length > 0;

  const orderIdValidation = useMemo(
    () => getOrderIdValidation(pieces),
    [pieces]
  );

  function closeOrderIdErrorDialog() {
    setOrderIdErrorDialog(CLOSED_ORDER_ID_ERROR);
  }

  function toggleOrderIds() {
    setShowOrderIds((currentValue) => !currentValue);
  }

  // Una peça d'una agafada múltiple canvia el número de tot el grup
  function updatePieceOrderId(pieceId, value) {
    setPieces((currentPieces) => {
      const groupId = getGraspGroupId(
        currentPieces.find((piece) => piece.id === pieceId)
      );

      return currentPieces.map((piece) =>
        piece.id === pieceId ||
        (groupId !== null && getGraspGroupId(piece) === groupId)
          ? { ...piece, orderId: value }
          : piece
      );
    });
  }

  function cancelPendingLayerSelection() {
    setPendingLayerId(null);
    setIsPendingNewLayer(false);
    setIsUnsavedLayerDialogOpen(false);
  }

  function askToSaveBeforeLeaving(nextLayerId, isNewLayer) {
    setPendingLayerId(nextLayerId);
    setIsPendingNewLayer(isNewLayer);
    setIsUnsavedLayerDialogOpen(true);
  }

  function applyEmptyLayer() {
    suppressNextChangeDetectionRef.current = true;
    orderIdDefinition.stopDefiningOrderIds();

    setPieces([]);
    clearPieceSelection();

    setActiveLayerId(null);
    setLayerName("");

    cancelPendingLayerSelection();
  }

  function requestNewEmptyLayer() {
    if (isCurrentLayerDirty) {
      askToSaveBeforeLeaving(null, true);
      return;
    }

    applyEmptyLayer();
  }

  function applySavedLayer(layerId) {
    const layerToApply = layers.find(
      (layer) => layer.id === layerId
    );

    if (!layerToApply) {
      return;
    }

    suppressNextChangeDetectionRef.current = true;
    orderIdDefinition.stopDefiningOrderIds();

    setPieces(ensureOrderIds(layerToApply.pieces));
    clearPieceSelection();

    setActiveLayerId(layerToApply.id);
    setLayerName(layerToApply.name);

    loadLayerGripperOffsets(layerToApply);
    setShowOrderIds(false);
  }

  /*
    Desa les peces actuals com a capa.

    - Mateix nom que la capa activa: l'actualitza.
    - Nom d'una altra capa existent: actualitza
      aquella capa.
    - Nom nou: crea una capa nova.

    Retorna la capa desada, o null si els orderId
    no són vàlids.
  */
  function saveCurrentLayer(forcedName = null) {
    const validation = getOrderIdValidation(pieces);

    if (!validation.isValid) {
      setOrderIdErrorDialog({
        open: true,
        message: createOrderIdErrorMessage(validation)
      });

      setShowOrderIds(true);

      return null;
    }

    const nameToUse =
      typeof forcedName === "string"
        ? forcedName
        : layerName;

    const finalName =
      nameToUse.trim() ||
      activeLayer?.name ||
      t.layer.defaultName(layers.length + 1);

    const normalizedFinalName = finalName.toLowerCase();
    const currentDate = new Date().toISOString();

    const isUpdatingActiveLayer = Boolean(
      activeLayer &&
        activeLayer.name.toLowerCase() ===
          normalizedFinalName
    );

    const existingLayerByName = layers.find(
      (layer) =>
        layer.name.toLowerCase() === normalizedFinalName
    );

    const layerIdToUse = isUpdatingActiveLayer
      ? activeLayer.id
      : existingLayerByName?.id ?? createLayerId();

    const existingLayer = layers.find(
      (layer) => layer.id === layerIdToUse
    );

    const layerToSave = {
      id: layerIdToUse,
      name: finalName,
      createdAt: existingLayer?.createdAt ?? currentDate,
      updatedAt: currentDate,
      // Offsets genèrics de la capa (es recuperen en aplicar-la)
      gripperOffsets: {
        approach: { ...currentLayerGripperOffsets.approach },
        retreat: { ...currentLayerGripperOffsets.retreat }
      },
      pieces: cloneLayerPieces(
        pieces.map((piece) => ({
          ...piece,
          orderId: Number(piece.orderId)
        }))
      )
    };

    setLayers((currentLayers) =>
      currentLayers.some(
        (layer) => layer.id === layerToSave.id
      )
        ? currentLayers.map((layer) =>
            layer.id === layerToSave.id
              ? layerToSave
              : layer
          )
        : [...currentLayers, layerToSave]
    );

    setActiveLayerId(layerToSave.id);
    setLayerName(layerToSave.name);
    setHasUnsavedChanges(true);

    return layerToSave;
  }

  /*
    Abans de guardar el projecte: si la composició té
    canvis, es desa com a capa. Retorna les capes que
    s'han de guardar al projecte (el setLayers encara no
    s'ha aplicat), o null si els orderId no són vàlids.
  */
  function commitCurrentLayer() {
    if (!isCurrentLayerDirty) {
      return { layers, activeLayerId, layerChanged: false };
    }

    const savedLayer = saveCurrentLayer();

    if (!savedLayer) {
      return null;
    }

    return {
      layers: layers.some((layer) => layer.id === savedLayer.id)
        ? layers.map((layer) =>
            layer.id === savedLayer.id ? savedLayer : layer
          )
        : [...layers, savedLayer],
      activeLayerId: savedLayer.id,
      layerChanged: true
    };
  }

  function requestLayerSelection(layerId) {
    if (layerId === activeLayerId) {
      return;
    }

    if (isCurrentLayerDirty) {
      askToSaveBeforeLeaving(layerId, false);
      return;
    }

    applySavedLayer(layerId);
  }

  /*
    Continua cap a la capa (o capa nova) que
    s'havia demanat abans de l'avís.
  */
  function continuePendingLayerSelection() {
    const nextLayerId = pendingLayerId;
    const shouldCreateEmptyLayer = isPendingNewLayer;

    cancelPendingLayerSelection();

    if (shouldCreateEmptyLayer) {
      applyEmptyLayer();
      return;
    }

    if (nextLayerId) {
      applySavedLayer(nextLayerId);
    }
  }

  function savePendingLayerChanges() {
    if (!saveCurrentLayer()) {
      return;
    }

    continuePendingLayerSelection();
  }

  function discardPendingLayerChanges() {
    continuePendingLayerSelection();
  }

  function deleteSavedLayer(layerId) {
    setLayers((currentLayers) =>
      currentLayers.filter((layer) => layer.id !== layerId)
    );

    // La capa també desapareix de la paletització
    setPalletizingSequence((currentSequence) =>
      currentSequence.filter(
        (item) => item.sourceLayerId !== layerId
      )
    );

    if (activeLayerId === layerId) {
      setActiveLayerId(null);
      setLayerName("");
    }

    setHasUnsavedChanges(true);
  }

  function requestDeleteSavedLayer(layerId) {
    const layerToDelete = layers.find(
      (layer) => layer.id === layerId
    );

    if (!layerToDelete) {
      return;
    }

    openConfirmDialog({
      title: t.layer.deleteTitle,
      message: t.layer.deleteQuestion(layerToDelete.name),
      confirmLabel: t.common.yes,
      cancelLabel: t.common.no,
      destructive: true,
      onConfirm: () => {
        deleteSavedLayer(layerId);
      }
    });
  }

  return {
    ...orderIdDefinition,
    activeLayer,
    isCurrentLayerDirty,
    orderIdValidation,
    showOrderIds,
    toggleOrderIds,
    updatePieceOrderId,
    orderIdErrorDialog,
    closeOrderIdErrorDialog,
    isUnsavedLayerDialogOpen,
    requestNewEmptyLayer,
    saveCurrentLayer,
    commitCurrentLayer,
    requestLayerSelection,
    savePendingLayerChanges,
    discardPendingLayerChanges,
    cancelPendingLayerSelection,
    requestDeleteSavedLayer
  };
}
