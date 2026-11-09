import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getConveyorBeltWidth,
  setConveyorBeltWidth,
  subscribeConveyorBeltWidth
} from "../utils/conveyorPlacement.js";
import useCollisionGeometryVersion from "./useCollisionGeometryVersion.js";
import {
  evaluateConveyorConfiguration,
  applyGraspToPlacedPieces,
  findConveyorConfiguration,
  findLibraryPieceForPlaced,
  getPieceGraspFields,
  getPlacedPieceKey,
  getUnsavedPlacedPieceGroups,
  getUsedLibraryPieceIds,
  refreshConveyorConfigurations,
  upsertConveyorConfiguration,
  removeConveyorConfiguration
} from "../utils/conveyorConfigurations.js";
import {
  createTemplateFromPiece,
  loadPieceLibrary,
  savePieceLibrary
} from "../utils/pieceLibrary.js";

/*
  Configurador de cinta: una fila per cada referència de
  peça que hi ha al palet (composició actual o qualsevol
  capa), amb zero o una configuració de cinta.

  - Les peces relacionades amb una plantilla de la
    biblioteca surten com a aquella plantilla.
  - Les que no ho estan (mai desades, o amb la plantilla
    eliminada) també surten, agrupades per tipus, mides i
    model, amb "Guardar i configurar".

  Les configuracions de peces que deixen de fer-se servir
  es conserven: tornen a sortir si la peça es torna a usar.

  Estats de cada fila:
  - "notSaved" / "templateMissing": peça sense plantilla
    (Guardar i configurar);
  - "notConfigured": sense configuració (Configurar);
  - "configured": configuració vàlida (Editar, Eliminar);
  - "needsReview": geometria canviada o migració pendent
    (Revisar, Eliminar).
*/
export default function useConveyorConfigurations({
  projectDocument,
  pieceLibrary,
  openConfirmDialog,
  t
}) {
  const {
    conveyorConfigurations,
    setConveyorConfigurations,
    pieces,
    setPieces,
    layers,
    setLayers
  } = projectDocument;

  // Peça amb el popup obert (null = tancat)
  const [dialogPieceId, setDialogPieceId] = useState(null);

  // Canvia quan s'acaba de calcular el volum d'un model importat
  const collisionGeometryVersion = useCollisionGeometryVersion();

  // Amplada de la cinta (global): si canvia, es tornen a avaluar les peces
  const beltWidth = useSyncExternalStore(
    subscribeConveyorBeltWidth,
    getConveyorBeltWidth
  );

  // Totes les peces del palet: composició actual i totes les capes
  const placedPieces = useMemo(
    () => [...pieces, ...layers.flatMap((layer) => layer.pieces ?? [])],
    [pieces, layers]
  );

  const usedPieceIds = useMemo(
    () => getUsedLibraryPieceIds(placedPieces, pieceLibrary),
    [placedPieces, pieceLibrary]
  );

  // Peces del palet sense plantilla, una fila per referència
  const unsavedGroups = useMemo(
    () => getUnsavedPlacedPieceGroups(placedPieces, pieceLibrary),
    [placedPieces, pieceLibrary]
  );

  const listItems = useMemo(
    () => [
      ...pieceLibrary
        .filter((piece) => usedPieceIds.has(piece.id))
        .map((piece) => {
          const configuration = findConveyorConfiguration(
            conveyorConfigurations,
            piece.id
          );

          let state = "notConfigured";

          if (configuration) {
            state =
              evaluateConveyorConfiguration(configuration, piece, {
                beltWidth,
                // El resultat depèn del volum carregat del model
                collisionGeometryVersion
              }).status === "valid"
                ? "configured"
                : "needsReview";
          }

          return { key: piece.id, piece, configuration, state };
        }),
      /*
        Peces que no són a la biblioteca (mai desades com a
        plantilla, o amb la plantilla eliminada): també es
        mostren, amb "Guardar i configurar".
      */
      ...unsavedGroups.map((group) => ({
        key: `unsaved:${group.key}`,
        groupKey: group.key,
        piece: group.piece,
        names: group.names,
        count: group.count,
        configuration: null,
        state: group.templateMissing ? "templateMissing" : "notSaved"
      }))
    ],
    [
      conveyorConfigurations,
      pieceLibrary,
      usedPieceIds,
      unsavedGroups,
      beltWidth,
      collisionGeometryVersion
    ]
  );

  // Aplica un canvi a totes les peces del palet (composició i capes)
  function updatePlacedPieces(updatePieceList) {
    setPieces(updatePieceList);
    setLayers((currentLayers) => {
      let changed = false;

      const next = currentLayers.map((layer) => {
        const layerPieces = updatePieceList(layer.pieces ?? []);

        if (layerPieces === layer.pieces) {
          return layer;
        }

        changed = true;
        return { ...layer, pieces: layerPieces };
      });

      return changed ? next : currentLayers;
    });
  }

  /*
    Desa a la biblioteca una peça del palet que no hi és:
    crea la plantilla (amb el nom indicat o el de la
    peça) i hi vincula totes les peces iguals sense
    plantilla (composició i capes). Amb renamePieces,
    aquestes peces prenen el nom de la plantilla.

    Retorna la plantilla creada, o null si no s'ha pogut
    desar.
  */
  function saveLibraryPieceFromPlaced(
    sourcePiece,
    { name = null, renamePieces = false } = {}
  ) {
    const currentLibrary = loadPieceLibrary();
    const template = createTemplateFromPiece(
      name ? { ...sourcePiece, name } : sourcePiece,
      currentLibrary
    );

    if (!savePieceLibrary([...currentLibrary, template])) {
      window.alert(t.pieceDialog.saveError);
      return null;
    }

    const groupKey = getPlacedPieceKey(sourcePiece);
    const libraryBefore = pieceLibrary;

    updatePlacedPieces((placedList) => {
      let changed = false;

      const next = placedList.map((piece) => {
        if (
          piece.pieceCategory === "SEPARATOR" ||
          getPlacedPieceKey(piece) !== groupKey ||
          findLibraryPieceForPlaced(piece, libraryBefore)
        ) {
          return piece;
        }

        changed = true;
        return {
          ...piece,
          libraryPieceId: template.id,
          ...(renamePieces ? { name: template.name } : {})
        };
      });

      return changed ? next : placedList;
    });

    return template;
  }

  /*
    "Guardar i configurar" una peça del palet que no és a
    la biblioteca: es desa i s'obre el popup de
    configuració.
  */
  function saveAndConfigure(groupKey) {
    const group = unsavedGroups.find((item) => item.key === groupKey);

    if (!group) {
      return;
    }

    const template = saveLibraryPieceFromPlaced(group.piece);

    if (template) {
      setDialogPieceId(template.id);
    }
  }

  /*
    Canvi de nom d'una peça que ve d'una plantilla: el
    nom nou s'aplica a la plantilla i a totes les peces
    del palet i de les capes que en provenen, perquè el
    producte tingui el mateix nom a tot arreu.

    Retorna { error } si el nom ja el té una altra
    plantilla de la biblioteca.
  */
  function renameLibraryPiece(templateId, newName) {
    const name = String(newName ?? "").trim();
    const currentLibrary = loadPieceLibrary();

    if (!name) {
      return { error: t.pieceDialog.nameRequired };
    }

    const nameInUse = currentLibrary.some(
      (item) =>
        item.id !== templateId &&
        String(item.name ?? "").trim().toLowerCase() === name.toLowerCase()
    );

    if (nameInUse) {
      return { error: t.pieceDialog.nameInUse(name) };
    }

    const libraryBefore = pieceLibrary;

    if (
      !savePieceLibrary(
        currentLibrary.map((item) =>
          item.id === templateId ? { ...item, name } : item
        )
      )
    ) {
      return { error: t.pieceDialog.saveError };
    }

    updatePlacedPieces((placedList) => {
      let changed = false;

      const next = placedList.map((piece) => {
        if (findLibraryPieceForPlaced(piece, libraryBefore)?.id !== templateId) {
          return piece;
        }

        changed = true;
        return { ...piece, name, libraryPieceId: templateId };
      });

      return changed ? next : placedList;
    });

    return {};
  }

  const dialogPiece =
    dialogPieceId === null
      ? null
      : pieceLibrary.find((piece) => piece.id === dialogPieceId) ?? null;

  const dialogConfiguration = dialogPiece
    ? findConveyorConfiguration(conveyorConfigurations, dialogPiece.id)
    : null;

  function openConfiguration(pieceId) {
    setDialogPieceId(pieceId);
  }

  function closeDialog() {
    setDialogPieceId(null);
  }

  // Una sola configuració per peça: crea o actualitza
  function saveConfiguration(configuration) {
    /*
      L'amplada de la cinta és global: la del popup passa
      a ser la de totes les peces i projectes, i les poses
      desades de les altres configuracions es tornen a
      calcular (totes queden centrades a la nova amplada).
    */
    setConveyorBeltWidth(configuration.placement.beltWidth);

    setConveyorConfigurations((current) =>
      refreshConveyorConfigurations(
        upsertConveyorConfiguration(current, configuration),
        pieceLibrary
      )
    );

    /*
      L'agafada vàlida passa a les peces del simulador
      (composició actual i totes les capes): el TCP de la
      pinça sobre el palet és el mateix que a la cinta.
    */
    const libraryPiece = pieceLibrary.find(
      (piece) => piece.id === configuration.pieceId
    );

    if (libraryPiece && configuration.status === "valid") {
      updatePlacedPieces((placedList) =>
        applyGraspToPlacedPieces(
          placedList,
          libraryPiece,
          configuration,
          pieceLibrary
        )
      );
    }

    closeDialog();
  }

  /*
    Agafada configurada per a una peça nova creada des
    d'una plantilla (null si no n'hi ha de vàlida).
  */
  function getGraspForLibraryPiece(libraryPieceId) {
    const configuration = findConveyorConfiguration(
      conveyorConfigurations,
      libraryPieceId
    );
    const libraryPiece = pieceLibrary.find(
      (piece) => piece.id === libraryPieceId
    );

    if (
      !configuration ||
      !libraryPiece ||
      evaluateConveyorConfiguration(configuration, libraryPiece).status !==
        "valid"
    ) {
      return null;
    }

    return getPieceGraspFields(configuration);
  }

  // Elimina només la configuració: la peça continua a la llista
  function deleteConfiguration(pieceId) {
    const piece = pieceLibrary.find((item) => item.id === pieceId);

    openConfirmDialog({
      title: t.conveyorConfigurator.deleteTitle,
      message: t.conveyorConfigurator.deleteMessage(piece?.name ?? ""),
      confirmLabel: t.common.yes,
      cancelLabel: t.common.no,
      destructive: true,
      onConfirm: () => {
        setConveyorConfigurations((current) =>
          removeConveyorConfiguration(current, pieceId)
        );
      }
    });
  }

  /*
    Eliminar una peça de la biblioteca (Configurador de
    peces). Si té configuració de cinta, avisa i, si es
    confirma, l'elimina també: no queden configuracions
    sense peça.
  */
  function requestPieceDeletion(pieceId, pieceName, deletePiece) {
    if (!findConveyorConfiguration(conveyorConfigurations, pieceId)) {
      deletePiece();
      return;
    }

    openConfirmDialog({
      title: t.conveyorConfigurator.deletePieceTitle,
      message: t.conveyorConfigurator.deletePieceMessage(pieceName),
      confirmLabel: t.conveyorConfigurator.deletePieceConfirm,
      cancelLabel: t.common.cancel,
      destructive: true,
      onConfirm: () => {
        setConveyorConfigurations((current) =>
          removeConveyorConfiguration(current, pieceId)
        );
        deletePiece();
      }
    });
  }

  return {
    listItems,
    dialogPiece,
    dialogConfiguration,
    openConfiguration,
    closeDialog,
    saveConfiguration,
    saveAndConfigure,
    saveLibraryPieceFromPlaced,
    renameLibraryPiece,
    getGraspForLibraryPiece,
    deleteConfiguration,
    requestPieceDeletion
  };
}
