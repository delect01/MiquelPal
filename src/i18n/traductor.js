export const SUPPORTED_LANGUAGES = [
  {
    code: "ca",
    label: "Català",
    direction: "ltr"
  },
  {
    code: "es",
    label: "Castellano",
    direction: "ltr"
  },
  {
    code: "en",
    label: "English",
    direction: "ltr"
  },
  {
    code: "fr",
    label: "Français",
    direction: "ltr"
  },
  {
    code: "ar",
    label: "العربية",
    direction: "rtl"
  }
];

const translations = {
  ca: {
    project: {
      unnamed: "Projecte sense nom",
      recovered: "Projecte recuperat",
      saved: "Projecte guardat",
      unsavedChanges: "Canvis sense guardar",
      newTitle: "Crear un projecte nou",
      newDiscardMessage:
        "Hi ha canvis sense guardar. Si continues, la composició actual es descartarà.",
      openTitle: "Obrir un altre projecte",
      openDiscardMessage:
        "Hi ha canvis sense guardar. Si continues, la composició actual es descartarà.",
      discardAndContinue: "Descartar i continuar",
      discardAndOpen: "Descartar i obrir",
      saveError: "No s'ha pogut guardar el projecte.",
      saveNameRequired: "Escriu un nom per al projecte.",
      previousSession:
        "S'ha trobat una sessió anterior sense guardar. Vols recuperar-la?",
      copySuffix: "còpia"
    },
    projectMenu: {
      title: "Projecte",
      saved: "Projecte guardat",
      unsaved: "Canvis sense guardar",
      newProject: "Nou projecte",
      openProject: "Obrir projecte",
      save: "Guardar",
      saveAs: "Guardar com a..."
    },
    palletDialog: {
      configure: "Configurar palet",
      subtitle: "Defineix el palet únic del simulador.",
      close: "Tancar",
      library: "Biblioteca de palets",
      list: "Llistat",
      deleteTemplate: "Eliminar plantilla",
      import3D: "Importar 3D",
      characteristics: "Característiques",
      palletName: "Nom del palet",
      namePlaceholder: "Exemple: Palet europeu",
      sizeX: "Mida X",
      sizeY: "Mida Y",
      sizeZ: "Mida Z",
      color: "Color",
      saveCharacteristics: "Guardar nom i característiques",
      preview3D: "Previsualització 3D",
      surfaceHelp: "La superfície superior sempre correspon a Z WORLD = 0.",
      applyPallet: "Aplicar palet",
      invalidDimensions: "Les dimensions X, Y i Z han de ser nombres superiors a zero.",
      nameRequired: "Has d'escriure un nom abans de guardar el palet.",
      saveError: "No s'ha pogut guardar el palet.",
      templateUpdated: "La plantilla del palet s'ha actualitzat.",
      templateSaved: "La plantilla del palet s'ha guardat.",
      applied: (name) => `Palet aplicat: ${name}`,
      selectBeforeDelete: "Selecciona una plantilla abans d'eliminar-la.",
      deleteError: "No s'ha pogut eliminar la plantilla.",
      templateDeleted: "La plantilla del palet s'ha eliminat."
    },
    gripperPanel: {
      title: "Configurador pinça",
      newGripper: "Nova pinça",
      showGripper: "Mostrar pinça",
      hideGripper: "Ocultar pinça"
    },
    gripperDialog: {
      title: "Configurador gripper",
      subtitle: "Importa el model i defineix el TCP sobre la superfície.",
      library: "Biblioteca de grippers",
      list: "Llistat",
      deleteGripper: "Eliminar gripper",
      characteristics: "Característiques",
      sizeX: "Mida X",
      sizeY: "Mida Y",
      sizeZ: "Mida Z",
      offsetX: "Desplaçar X",
      offsetY: "Desplaçar Y",
      robotFront: "Robot Front",
      localTcp: "TCP local",
      selectTcp: "Seleccionar TCP sobre el model",
      selectingTcp: "Seleccionant TCP...",
      position: "Pos",
      saveCharacteristics: "Guardar nom i característiques",
      preview3D: "Previsualització 3D",
      applyGripper: "Aplicar gripper",
      import3D: "Importar 3D",
      importing: "Important...",
      modelUnits: "Unitats del model 3D",
      importError: "No s'ha pogut importar el model 3D.",
      invalidSizes: "Les mides X, Y i Z han de ser superiors a zero.",
      invalidOffsets: "Els desplaçaments i Robot Front han de ser nombres vàlids.",
      modelAndTcpRequired: "Importa el model i selecciona el TCP abans de guardar o aplicar.",
      nameRequired: "Escriu un nom abans de guardar la gripper.",
      updated: "La gripper s'ha actualitzat.",
      saved: "La gripper s'ha guardat.",
      modelImported: "Model importat. Fes clic sobre la superfície per definir el TCP.",
      tcpDefined: "TCP definit. Ajusta posició o orientació si cal."
    },
    configurators: {
      gripper: "Configurador gripper",
      pallet: "Configurador palet",
      pieces: "Configurador peces",
      separators: "Configurador separadors",
      layers: "Configurador capes",
      palletizing: "Configurador paletitzat"
    },
    pieceDialog: {
      title: "Nova peça",
      subtitle: "Defineix una geometria o importa un model 3D.",
      library: "Biblioteca de peces",
      list: "Llistat",
      deleteTemplate: "Eliminar plantilla",
      characteristics: "Característiques",
      pieceName: "Nom de la peça",
      bottomFace: "Cara inferior de la peça",
      model: "Model",
      calculatedDimensions: "Dimensions calculades",
      pieceType: "Tipus de peça",
      rectangular: "Rectangular",
      trapezoidal: "Trapezoïdal",
      width: "Amplada",
      height: "Alçada",
      depth: "Profunditat",
      topWidth: "Amplada superior",
      topDepth: "Profunditat superior",
      saveCharacteristics: "Guardar nom i característiques",
      preview3D: "Previsualització 3D",
      createPiece: "Crear peça",
      invalidDimensions: "Les dimensions calculades no són vàlides.",
      nameRequired: "Has d'escriure un nom abans de guardar la peça.",
      templateUpdated: "La plantilla s'ha actualitzat.",
      templateSaved: "La plantilla s'ha guardat.",
      templateDeleted: "La plantilla s'ha eliminat.",
      modelImported: "Model importat. Revisa l'orientació, escriu el nom i crea o guarda la peça.",
      bottomFaces: {
        NEGATIVE_Y: "Cara inferior actual (-Y)",
        POSITIVE_Y: "Cara superior actual (+Y)",
        NEGATIVE_X: "Cara esquerra actual (-X)",
        POSITIVE_X: "Cara dreta actual (+X)",
        NEGATIVE_Z: "Cara posterior actual (-Z)",
        POSITIVE_Z: "Cara frontal actual (+Z)"
      }
    },
    pieces: {
      title: "CONFIGURADOR PECES",
      new: "Nova peça",
      duplicate: "Duplicar",
      delete: "Eliminar",
      selected: "PEÇA SELECCIONADA",
      defaultName: "Peça",
      position: "Posició peça"
    },
    separatorDialog: {
      title: "Nou separador",
      subtitle: "Separador rectangular amb referència TCP fixa a TOP_CENTER.",
      close: "Tancar",
      library: "Biblioteca de separadors",
      list: "Llistat",
      deleteTemplate: "Eliminar plantilla",
      import3D: "Importar 3D",
      characteristics: "Característiques",
      widthX: "Amplada X",
      depthY: "Profunditat Y",
      thicknessZ: "Gruix Z",
      color: "Color",
      saveCharacteristics: "Guardar nom i característiques",
      preview3D: "Previsualització 3D",
      previewHelp: "La bola verda representa TOP_CENTER. L'eix X és vermell, l'eix Y és verd i la Z blava indica la direcció d'atac.",
      createSeparator: "Crear separador",
      invalidDimensions: "Amplada, profunditat i gruix han de ser nombres superiors a zero.",
      nameRequired: "Escriu un nom abans de guardar el separador.",
      saveError: "No s'ha pogut guardar el separador.",
      separatorUpdated: "El separador s'ha actualitzat.",
      separatorSaved: "El separador s'ha guardat.",
      loaded: (name) => `Separador carregat: ${name}`,
      deleteError: "No s'ha pogut eliminar el separador.",
      deletedFromLibrary: "El separador s'ha eliminat de la biblioteca.",
      importLater: "La importació 3D es programarà en una fase posterior."
    },
    separators: {
      title: "CONFIGURADOR SEPARADORS",
      new: "Nou separador",
      duplicate: "Duplicar",
      delete: "Eliminar",
      selected: "SEPARADOR SELECCIONAT",
      defaultName: "Separador",
      position: "Posició separador"
    },
    selection: {
      groupMove: "Desplaçament del grup",
      groupMoveHelp:
        "Introdueix un desplaçament en mil·límetres. Els valors s'aplicaran a tots els elements seleccionats.",
      multipleTitle: "SELECCIÓ MÚLTIPLE",
      selectedElements: "elements seleccionats",
      help:
        "Arrossega qualsevol element seleccionat per moure tot el grup. Prem Supr per eliminar la selecció."
    },
    reference: {
      robotTcp: "Referència TCP Robot",
      contactFace: "Cara contacte",
      orientation: "Orientació referència",
      faceOffsetX: "Face Offset X",
      faceOffsetY: "Face Offset Y",
      faceRotation: "Face Rotation",
      refRx: "Ref RX",
      refRy: "Ref RY",
      refRz: "Ref RZ",
      points: {
        CENTER: "Centre",
        TOP_CENTER: "Centre superior",
        BOTTOM_CENTER: "Centre inferior",
        LEFT_CENTER: "Centre esquerre",
        RIGHT_CENTER: "Centre dret",
        FRONT_CENTER: "Centre frontal",
        BACK_CENTER: "Centre posterior"
      }
    },
    layer: {
      title: "CONFIGURADOR DE CAPES",
      newEmpty: "Nova capa buida",
      save: "Guardar capa",
      placeholder: "Exemple: Capa parell",
      idsOn: "ID activats",
      idsOff: "ID desactivats",
      gripperOffsets: "Gripper offsets",
      unsavedComposition: "La composició actual té canvis sense guardar com a capa.",
      savedLayers: "Capes guardades",
      noSavedLayers: "Encara no hi ha cap capa guardada.",
      deleteTitle: "Eliminar capa",
      deleteQuestion: (name) =>
        `Estàs segur que vols eliminar la capa "${name}"?`,
      defaultName: (number) => `Capa ${number}`,
      idErrorTitle: "No es pot guardar la capa",
      idCorrection: "Corregeix els ID i torna-ho a provar.",
      idConsecutive: (maximum) =>
        `Els ID han de ser consecutius de l'1 al ${maximum}.`,
      idEmpty: (count) => `${count} element(s) sense ID.`,
      idInvalid: (count) =>
        `${count} element(s) amb un ID que no és un enter positiu.`,
      idDuplicate: (count) =>
        `${count} element(s) comparteixen un ID duplicat.`
    },
    layerUi: {
      title: "CONFIGURADOR DE CAPES", newEmpty: "Nova capa buida", save: "Guardar capa", placeholder: "Exemple: Capa parell",
      idsOn: "ID activats", idsOff: "ID desactivats", gripperOffsets: "Gripper offsets",
      unsavedComposition: "La composició actual té canvis sense guardar com a capa."
    },
    unsavedLayer: {
      title: "Capa sense guardar", message: (name) => name ? `La composició actual de la capa “${name}” té canvis sense guardar. Pots guardar-la abans de carregar una altra capa o descartar els canvis.` : "La composició actual té canvis sense guardar. Pots guardar-la abans de carregar una altra capa o descartar els canvis.", discard: "Descartar canvis"
    },
    orderIds: { errorAria: "Error d'identificadors" },
    gripperOffsets: {
      generic: "Offsets genèrics", piece: (id) => "Offsets peça ID " + id,
      custom: "Aquesta peça utilitza offsets personalitzats.", inherited: "Aquesta peça hereta els offsets genèrics.",
      approach: "Offset aproximació", retreat: "Offset allunyament", useGeneric: "Utilitzar offsets genèrics"
    },
    palletizing: {
      title: "CONFIGURADOR PALETITZAT",
      availableLayers: "Capes disponibles",
      saveLayerFirst: "Primer has de guardar una capa.",
      addLayer: (name) => "Afegir " + name,
      sequence: "Seqüència del paletitzat",
      noLayersAdded: "Encara no has afegit cap capa.",
      layerUnavailable: "Capa no disponible",
      deleteHelp: "Selecciona una capa de la seqüència o un bloc 3D i prem Supr per eliminar-la."
    },
    common: {
      id: "ID",
      name: "Nom",
      yes: "Sí",
      no: "No",
      accept: "Acceptar",
      confirm: "Confirmar",
      cancel: "Cancel·lar",
      x: "X",
      y: "Y",
      z: "Z",
      rx: "RX",
      ry: "RY",
      rz: "RZ"
    },
    language: {
      change: "Canviar idioma",
      internalJokeLink:
        "https://www.amazon.es/diccionario-catalan-castellano/s?k=diccionario+catalan+castellano"
    }
  },
  es: {
    project: {
      unnamed: "Proyecto sin nombre",
      recovered: "Proyecto recuperado",
      saved: "Proyecto guardado",
      unsavedChanges: "Cambios sin guardar"
    },
    projectMenu: {
      title: "Proyecto",
      saved: "Proyecto guardado",
      unsaved: "Cambios sin guardar",
      newProject: "Nuevo proyecto",
      openProject: "Abrir proyecto",
      save: "Guardar",
      saveAs: "Guardar como..."
    },
    palletDialog: {
      configure: "Configurar palé",
      subtitle: "Define el único palé del simulador.",
      close: "Cerrar",
      library: "Biblioteca de palés",
      list: "Listado",
      deleteTemplate: "Eliminar plantilla",
      import3D: "Importar 3D",
      characteristics: "Características",
      palletName: "Nombre del palé",
      namePlaceholder: "Ejemplo: Palé europeo",
      sizeX: "Tamaño X",
      sizeY: "Tamaño Y",
      sizeZ: "Tamaño Z",
      color: "Color",
      saveCharacteristics: "Guardar nombre y características",
      preview3D: "Vista previa 3D",
      surfaceHelp: "La superficie superior siempre corresponde a Z WORLD = 0.",
      applyPallet: "Aplicar palé",
      invalidDimensions: "Las dimensiones X, Y y Z deben ser números superiores a cero.",
      nameRequired: "Debes escribir un nombre antes de guardar el palé.",
      saveError: "No se ha podido guardar el palé.",
      templateUpdated: "La plantilla del palé se ha actualizado.",
      templateSaved: "La plantilla del palé se ha guardado.",
      applied: (name) => `Palé aplicado: ${name}`,
      selectBeforeDelete: "Selecciona una plantilla antes de eliminarla.",
      deleteError: "No se ha podido eliminar la plantilla.",
      templateDeleted: "La plantilla del palé se ha eliminado."
    },
    gripperPanel: {
      title: "Configurador de pinza",
      newGripper: "Nueva pinza",
      showGripper: "Mostrar pinza",
      hideGripper: "Ocultar pinza"
    },
    gripperDialog: {
      title: "Configurador de pinza",
      subtitle: "Importa el modelo y define el TCP sobre la superficie.",
      library: "Biblioteca de pinzas",
      list: "Listado",
      deleteGripper: "Eliminar pinza",
      characteristics: "Características",
      sizeX: "Tamaño X",
      sizeY: "Tamaño Y",
      sizeZ: "Tamaño Z",
      offsetX: "Desplazar X",
      offsetY: "Desplazar Y",
      robotFront: "Frente del robot",
      localTcp: "TCP local",
      selectTcp: "Seleccionar TCP sobre el modelo",
      selectingTcp: "Seleccionando TCP...",
      position: "Pos",
      saveCharacteristics: "Guardar nombre y características",
      preview3D: "Vista previa 3D",
      applyGripper: "Aplicar pinza",
      import3D: "Importar 3D",
      importing: "Importando...",
      modelUnits: "Unidades del modelo 3D",
      importError: "No se ha podido importar el modelo 3D.",
      invalidSizes: "Los tamaños X, Y y Z deben ser superiores a cero.",
      invalidOffsets: "Los desplazamientos y el frente del robot deben ser números válidos.",
      modelAndTcpRequired: "Importa el modelo y selecciona el TCP antes de guardar o aplicar.",
      nameRequired: "Escribe un nombre antes de guardar la pinza.",
      updated: "La pinza se ha actualizado.",
      saved: "La pinza se ha guardado.",
      modelImported: "Modelo importado. Haz clic sobre la superficie para definir el TCP.",
      tcpDefined: "TCP definido. Ajusta la posición o la orientación si es necesario."
    },
    pieceDialog: {
      title: "Nueva pieza",
      subtitle: "Define una geometría o importa un modelo 3D.",
      library: "Biblioteca de piezas",
      list: "Listado",
      deleteTemplate: "Eliminar plantilla",
      characteristics: "Características",
      pieceName: "Nombre de la pieza",
      bottomFace: "Cara inferior de la pieza",
      model: "Modelo",
      calculatedDimensions: "Dimensiones calculadas",
      pieceType: "Tipo de pieza",
      rectangular: "Rectangular",
      trapezoidal: "Trapezoidal",
      width: "Anchura",
      height: "Altura",
      depth: "Profundidad",
      topWidth: "Anchura superior",
      topDepth: "Profundidad superior",
      saveCharacteristics: "Guardar nombre y características",
      preview3D: "Vista previa 3D",
      createPiece: "Crear pieza",
      invalidDimensions: "Las dimensiones calculadas no son válidas.",
      nameRequired: "Debes escribir un nombre antes de guardar la pieza.",
      templateUpdated: "La plantilla se ha actualizado.",
      templateSaved: "La plantilla se ha guardado.",
      templateDeleted: "La plantilla se ha eliminado.",
      modelImported: "Modelo importado. Revisa la orientación, escribe el nombre y crea o guarda la pieza.",
      bottomFaces: {
        NEGATIVE_Y: "Cara inferior actual (-Y)",
        POSITIVE_Y: "Cara superior actual (+Y)",
        NEGATIVE_X: "Cara izquierda actual (-X)",
        POSITIVE_X: "Cara derecha actual (+X)",
        NEGATIVE_Z: "Cara posterior actual (-Z)",
        POSITIVE_Z: "Cara frontal actual (+Z)"
      }
    },
    pieces: {
      title: "CONFIGURADOR DE PIEZAS",
      new: "Nueva pieza",
      duplicate: "Duplicar",
      delete: "Eliminar",
      selected: "PIEZA SELECCIONADA",
      defaultName: "Pieza",
      position: "Posición de la pieza"
    },
    separatorDialog: {
      title: "Nuevo separador",
      subtitle: "Separador rectangular con referencia TCP fija en TOP_CENTER.",
      close: "Cerrar",
      library: "Biblioteca de separadores",
      list: "Listado",
      deleteTemplate: "Eliminar plantilla",
      import3D: "Importar 3D",
      characteristics: "Características",
      widthX: "Anchura X",
      depthY: "Profundidad Y",
      thicknessZ: "Grosor Z",
      color: "Color",
      saveCharacteristics: "Guardar nombre y características",
      preview3D: "Vista previa 3D",
      previewHelp: "La esfera verde representa TOP_CENTER. El eje X es rojo, el eje Y es verde y el eje Z azul indica la dirección de ataque.",
      createSeparator: "Crear separador",
      invalidDimensions: "La anchura, la profundidad y el grosor deben ser números superiores a cero.",
      nameRequired: "Escribe un nombre antes de guardar el separador.",
      saveError: "No se ha podido guardar el separador.",
      separatorUpdated: "El separador se ha actualizado.",
      separatorSaved: "El separador se ha guardado.",
      loaded: (name) => `Separador cargado: ${name}`,
      deleteError: "No se ha podido eliminar el separador.",
      deletedFromLibrary: "El separador se ha eliminado de la biblioteca.",
      importLater: "La importación 3D se programará en una fase posterior."
    },
    separators: {
      title: "CONFIGURADOR DE SEPARADORES",
      new: "Nuevo separador",
      duplicate: "Duplicar",
      delete: "Eliminar",
      selected: "SEPARADOR SELECCIONADO",
      defaultName: "Separador",
      position: "Posición del separador"
    },
    layer: {
      title: "CONFIGURADOR DE CAPAS",
      newEmpty: "Nueva capa vacía",
      save: "Guardar capa",
      placeholder: "Ejemplo: Capa par",
      idsOn: "ID activados",
      idsOff: "ID desactivados",
      gripperOffsets: "Offsets de pinza",
      unsavedComposition: "La composición actual tiene cambios sin guardar como capa.",
      savedLayers: "Capas guardadas",
      noSavedLayers: "Todavía no hay ninguna capa guardada.",
      deleteTitle: "Eliminar capa",
      deleteQuestion: (name) =>
        `¿Seguro que quieres eliminar la capa "${name}"?`,
      defaultName: (number) => `Capa ${number}`,
      idErrorTitle: "No se puede guardar la capa",
      idCorrection: "Corrige los ID y vuelve a intentarlo.",
      idConsecutive: (maximum) =>
        `Los ID deben ser consecutivos del 1 al ${maximum}.`,
      idEmpty: (count) => `${count} elemento(s) sin ID.`,
      idInvalid: (count) =>
        `${count} elemento(s) con un ID que no es un entero positivo.`,
      idDuplicate: (count) =>
        `${count} elemento(s) comparten un ID duplicado.`
    },
    reference: {
      robotTcp: "Referencia TCP del robot",
      contactFace: "Cara de contacto",
      orientation: "Orientación de referencia",
      faceOffsetX: "Face Offset X",
      faceOffsetY: "Face Offset Y",
      faceRotation: "Face Rotation",
      refRx: "Ref RX",
      refRy: "Ref RY",
      refRz: "Ref RZ",
      points: {
        CENTER: "Centro",
        TOP_CENTER: "Centro superior",
        BOTTOM_CENTER: "Centro inferior",
        LEFT_CENTER: "Centro izquierdo",
        RIGHT_CENTER: "Centro derecho",
        FRONT_CENTER: "Centro frontal",
        BACK_CENTER: "Centro posterior"
      }
    },
    layerUi: {
      title: "CONFIGURADOR DE CAPAS", newEmpty: "Nueva capa vacía", save: "Guardar capa", placeholder: "Ejemplo: Capa par",
      idsOn: "ID activados", idsOff: "ID desactivados", gripperOffsets: "Offsets de pinza",
      unsavedComposition: "La composición actual tiene cambios sin guardar como capa."
    },
    unsavedLayer: {
      title: "Capa sin guardar", message: (name) => name ? `La composición actual de la capa “${name}” tiene cambios sin guardar. Puedes guardarla antes de cargar otra capa o descartar los cambios.` : "La composición actual tiene cambios sin guardar. Puedes guardarla antes de cargar otra capa o descartar los cambios.", discard: "Descartar cambios"
    },
    orderIds: { errorAria: "Error de identificadores" },
    gripperOffsets: {
      generic: "Offsets genéricos", piece: (id) => "Offsets de pieza ID " + id,
      custom: "Esta pieza utiliza offsets personalizados.", inherited: "Esta pieza hereda los offsets genéricos.",
      approach: "Offset de aproximación", retreat: "Offset de retirada", useGeneric: "Utilizar offsets genéricos"
    },
    palletizing: {
      title: "CONFIGURADOR DE PALETIZADO",
      availableLayers: "Capas disponibles",
      saveLayerFirst: "Primero debes guardar una capa.",
      addLayer: (name) => "Añadir " + name,
      sequence: "Secuencia de paletizado",
      noLayersAdded: "Todavía no has añadido ninguna capa.",
      layerUnavailable: "Capa no disponible",
      deleteHelp: "Selecciona una capa de la secuencia o un bloque 3D y pulsa Supr para eliminarla."
    },
    common: {
      id: "ID",
      name: "Nombre",
      yes: "Sí",
      no: "No",
      accept: "Aceptar",
      confirm: "Confirmar",
      cancel: "Cancelar",
      x: "X",
      y: "Y",
      z: "Z",
      rx: "RX",
      ry: "RY",
      rz: "RZ"
    },
    configurators: {
      gripper: "Configurador de pinza",
      pallet: "Configurador de palé",
      pieces: "Configurador de piezas",
      separators: "Configurador de separadores",
      layers: "Configurador de capas",
      palletizing: "Configurador de paletizado"
    }
  },
  en: {
    project: {
      unnamed: "Untitled project",
      recovered: "Recovered project",
      saved: "Project saved",
      unsavedChanges: "Unsaved changes"
    },
    projectMenu: {
      title: "Project",
      saved: "Project saved",
      unsaved: "Unsaved changes",
      newProject: "New project",
      openProject: "Open project",
      save: "Save",
      saveAs: "Save as..."
    },
    palletDialog: {
      configure: "Configure pallet",
      subtitle: "Define the simulator's single pallet.",
      close: "Close",
      library: "Pallet library",
      list: "List",
      deleteTemplate: "Delete template",
      import3D: "Import 3D",
      characteristics: "Characteristics",
      palletName: "Pallet name",
      namePlaceholder: "Example: Euro pallet",
      sizeX: "Size X",
      sizeY: "Size Y",
      sizeZ: "Size Z",
      color: "Color",
      saveCharacteristics: "Save name and characteristics",
      preview3D: "3D preview",
      surfaceHelp: "The top surface always corresponds to Z WORLD = 0.",
      applyPallet: "Apply pallet",
      invalidDimensions: "Dimensions X, Y and Z must be numbers greater than zero.",
      nameRequired: "Enter a name before saving the pallet.",
      saveError: "The pallet could not be saved.",
      templateUpdated: "The pallet template has been updated.",
      templateSaved: "The pallet template has been saved.",
      applied: (name) => `Pallet applied: ${name}`,
      selectBeforeDelete: "Select a template before deleting it.",
      deleteError: "The template could not be deleted.",
      templateDeleted: "The pallet template has been deleted."
    },
    gripperPanel: {
      title: "Gripper configurator",
      newGripper: "New gripper",
      showGripper: "Show gripper",
      hideGripper: "Hide gripper"
    },
    gripperDialog: {
      title: "Gripper configurator",
      subtitle: "Import the model and define the TCP on its surface.",
      library: "Gripper library",
      list: "List",
      deleteGripper: "Delete gripper",
      characteristics: "Characteristics",
      sizeX: "Size X",
      sizeY: "Size Y",
      sizeZ: "Size Z",
      offsetX: "Offset X",
      offsetY: "Offset Y",
      robotFront: "Robot Front",
      localTcp: "Local TCP",
      selectTcp: "Select TCP on the model",
      selectingTcp: "Selecting TCP...",
      position: "Pos",
      saveCharacteristics: "Save name and characteristics",
      preview3D: "3D preview",
      applyGripper: "Apply gripper",
      import3D: "Import 3D",
      importing: "Importing...",
      modelUnits: "3D model units",
      importError: "The 3D model could not be imported.",
      invalidSizes: "Sizes X, Y and Z must be greater than zero.",
      invalidOffsets: "Offsets and Robot Front must be valid numbers.",
      modelAndTcpRequired: "Import the model and select the TCP before saving or applying.",
      nameRequired: "Enter a name before saving the gripper.",
      updated: "The gripper has been updated.",
      saved: "The gripper has been saved.",
      modelImported: "Model imported. Click the surface to define the TCP.",
      tcpDefined: "TCP defined. Adjust its position or orientation if necessary."
    },
    pieceDialog: {
      title: "New piece",
      subtitle: "Define a geometry or import a 3D model.",
      library: "Piece library",
      list: "List",
      deleteTemplate: "Delete template",
      characteristics: "Characteristics",
      pieceName: "Piece name",
      bottomFace: "Bottom face of the piece",
      model: "Model",
      calculatedDimensions: "Calculated dimensions",
      pieceType: "Piece type",
      rectangular: "Rectangular",
      trapezoidal: "Trapezoidal",
      width: "Width",
      height: "Height",
      depth: "Depth",
      topWidth: "Top width",
      topDepth: "Top depth",
      saveCharacteristics: "Save name and characteristics",
      preview3D: "3D preview",
      createPiece: "Create piece",
      invalidDimensions: "The calculated dimensions are invalid.",
      nameRequired: "Enter a name before saving the piece.",
      templateUpdated: "The template has been updated.",
      templateSaved: "The template has been saved.",
      templateDeleted: "The template has been deleted.",
      modelImported: "Model imported. Check its orientation, enter a name, and create or save the piece.",
      bottomFaces: {
        NEGATIVE_Y: "Current bottom face (-Y)",
        POSITIVE_Y: "Current top face (+Y)",
        NEGATIVE_X: "Current left face (-X)",
        POSITIVE_X: "Current right face (+X)",
        NEGATIVE_Z: "Current rear face (-Z)",
        POSITIVE_Z: "Current front face (+Z)"
      }
    },
    pieces: {
      title: "PIECE CONFIGURATOR",
      new: "New piece",
      duplicate: "Duplicate",
      delete: "Delete",
      selected: "SELECTED PIECE",
      defaultName: "Piece",
      position: "Piece position"
    },
    separatorDialog: {
      title: "New separator",
      subtitle: "Rectangular separator with a fixed TCP reference at TOP_CENTER.",
      close: "Close",
      library: "Separator library",
      list: "List",
      deleteTemplate: "Delete template",
      import3D: "Import 3D",
      characteristics: "Characteristics",
      widthX: "Width X",
      depthY: "Depth Y",
      thicknessZ: "Thickness Z",
      color: "Color",
      saveCharacteristics: "Save name and characteristics",
      preview3D: "3D preview",
      previewHelp: "The green sphere represents TOP_CENTER. The X axis is red, the Y axis is green, and the blue Z axis shows the attack direction.",
      createSeparator: "Create separator",
      invalidDimensions: "Width, depth and thickness must be numbers greater than zero.",
      nameRequired: "Enter a name before saving the separator.",
      saveError: "The separator could not be saved.",
      separatorUpdated: "The separator has been updated.",
      separatorSaved: "The separator has been saved.",
      loaded: (name) => `Separator loaded: ${name}`,
      deleteError: "The separator could not be deleted.",
      deletedFromLibrary: "The separator has been removed from the library.",
      importLater: "3D import will be implemented in a later phase."
    },
    separators: {
      title: "SEPARATOR CONFIGURATOR",
      new: "New separator",
      duplicate: "Duplicate",
      delete: "Delete",
      selected: "SELECTED SEPARATOR",
      defaultName: "Separator",
      position: "Separator position"
    },
    layer: {
      title: "LAYER CONFIGURATOR",
      newEmpty: "New empty layer",
      save: "Save layer",
      placeholder: "Example: Even layer",
      idsOn: "IDs enabled",
      idsOff: "IDs disabled",
      gripperOffsets: "Gripper offsets",
      unsavedComposition: "The current composition has unsaved layer changes.",
      savedLayers: "Saved layers",
      noSavedLayers: "There are no saved layers yet.",
      deleteTitle: "Delete layer",
      deleteQuestion: (name) =>
        `Are you sure you want to delete the layer "${name}"?`,
      defaultName: (number) => `Layer ${number}`,
      idErrorTitle: "The layer cannot be saved",
      idCorrection: "Correct the IDs and try again.",
      idConsecutive: (maximum) =>
        `IDs must be consecutive from 1 to ${maximum}.`,
      idEmpty: (count) => `${count} element(s) without an ID.`,
      idInvalid: (count) =>
        `${count} element(s) have an ID that is not a positive integer.`,
      idDuplicate: (count) =>
        `${count} element(s) share a duplicate ID.`
    },
    reference: {
      robotTcp: "Robot TCP reference",
      contactFace: "Contact face",
      orientation: "Reference orientation",
      faceOffsetX: "Face Offset X",
      faceOffsetY: "Face Offset Y",
      faceRotation: "Face Rotation",
      refRx: "Ref RX",
      refRy: "Ref RY",
      refRz: "Ref RZ",
      points: {
        CENTER: "Center",
        TOP_CENTER: "Top center",
        BOTTOM_CENTER: "Bottom center",
        LEFT_CENTER: "Left center",
        RIGHT_CENTER: "Right center",
        FRONT_CENTER: "Front center",
        BACK_CENTER: "Back center"
      }
    },
    layerUi: {
      title: "LAYER CONFIGURATOR", newEmpty: "New empty layer", save: "Save layer", placeholder: "Example: Even layer",
      idsOn: "IDs enabled", idsOff: "IDs disabled", gripperOffsets: "Gripper offsets",
      unsavedComposition: "The current composition has unsaved layer changes."
    },
    unsavedLayer: {
      title: "Unsaved layer", message: (name) => name ? `The current composition of layer “${name}” has unsaved changes. You can save it before loading another layer or discard the changes.` : "The current composition has unsaved changes. You can save it before loading another layer or discard the changes.", discard: "Discard changes"
    },
    orderIds: { errorAria: "Identifier error" },
    gripperOffsets: {
      generic: "Generic offsets", piece: (id) => "Piece ID offsets " + id,
      custom: "This piece uses custom offsets.", inherited: "This piece inherits the generic offsets.",
      approach: "Approach offset", retreat: "Retreat offset", useGeneric: "Use generic offsets"
    },
    palletizing: {
      title: "PALLETIZING CONFIGURATOR",
      availableLayers: "Available layers",
      saveLayerFirst: "You must save a layer first.",
      addLayer: (name) => "Add " + name,
      sequence: "Palletizing sequence",
      noLayersAdded: "You have not added any layers yet.",
      layerUnavailable: "Layer unavailable",
      deleteHelp: "Select a layer in the sequence or a 3D block and press Delete to remove it."
    },
    common: {
      id: "ID",
      name: "Name",
      yes: "Yes",
      no: "No",
      accept: "Accept",
      confirm: "Confirm",
      cancel: "Cancel",
      x: "X",
      y: "Y",
      z: "Z",
      rx: "RX",
      ry: "RY",
      rz: "RZ"
    },
    configurators: {
      gripper: "Gripper configurator",
      pallet: "Pallet configurator",
      pieces: "Piece configurator",
      separators: "Separator configurator",
      layers: "Layer configurator",
      palletizing: "Palletizing configurator"
    }
  },
  fr: {
    project: {
      unnamed: "Projet sans nom",
      recovered: "Projet récupéré",
      saved: "Projet enregistré",
      unsavedChanges: "Modifications non enregistrées"
    },
    projectMenu: {
      title: "Projet",
      saved: "Projet enregistré",
      unsaved: "Modifications non enregistrées",
      newProject: "Nouveau projet",
      openProject: "Ouvrir un projet",
      save: "Enregistrer",
      saveAs: "Enregistrer sous..."
    },
    palletDialog: {
      configure: "Configurer la palette",
      subtitle: "Définissez l'unique palette du simulateur.",
      close: "Fermer",
      library: "Bibliothèque de palettes",
      list: "Liste",
      deleteTemplate: "Supprimer le modèle",
      import3D: "Importer en 3D",
      characteristics: "Caractéristiques",
      palletName: "Nom de la palette",
      namePlaceholder: "Exemple : Palette Europe",
      sizeX: "Dimension X",
      sizeY: "Dimension Y",
      sizeZ: "Dimension Z",
      color: "Couleur",
      saveCharacteristics: "Enregistrer le nom et les caractéristiques",
      preview3D: "Aperçu 3D",
      surfaceHelp: "La surface supérieure correspond toujours à Z WORLD = 0.",
      applyPallet: "Appliquer la palette",
      invalidDimensions: "Les dimensions X, Y et Z doivent être des nombres supérieurs à zéro.",
      nameRequired: "Saisissez un nom avant d'enregistrer la palette.",
      saveError: "Impossible d'enregistrer la palette.",
      templateUpdated: "Le modèle de palette a été mis à jour.",
      templateSaved: "Le modèle de palette a été enregistré.",
      applied: (name) => `Palette appliquée : ${name}`,
      selectBeforeDelete: "Sélectionnez un modèle avant de le supprimer.",
      deleteError: "Impossible de supprimer le modèle.",
      templateDeleted: "Le modèle de palette a été supprimé."
    },
    gripperPanel: {
      title: "Configurateur de préhenseur",
      newGripper: "Nouveau préhenseur",
      showGripper: "Afficher le préhenseur",
      hideGripper: "Masquer le préhenseur"
    },
    gripperDialog: {
      title: "Configurateur de préhenseur",
      subtitle: "Importez le modèle et définissez le TCP sur sa surface.",
      library: "Bibliothèque de préhenseurs",
      list: "Liste",
      deleteGripper: "Supprimer le préhenseur",
      characteristics: "Caractéristiques",
      sizeX: "Dimension X",
      sizeY: "Dimension Y",
      sizeZ: "Dimension Z",
      offsetX: "Décalage X",
      offsetY: "Décalage Y",
      robotFront: "Face avant du robot",
      localTcp: "TCP local",
      selectTcp: "Sélectionner le TCP sur le modèle",
      selectingTcp: "Sélection du TCP...",
      position: "Pos",
      saveCharacteristics: "Enregistrer le nom et les caractéristiques",
      preview3D: "Aperçu 3D",
      applyGripper: "Appliquer le préhenseur",
      import3D: "Importer en 3D",
      importing: "Importation...",
      modelUnits: "Unités du modèle 3D",
      importError: "Impossible d'importer le modèle 3D.",
      invalidSizes: "Les dimensions X, Y et Z doivent être supérieures à zéro.",
      invalidOffsets: "Les décalages et la face avant du robot doivent être des nombres valides.",
      modelAndTcpRequired: "Importez le modèle et sélectionnez le TCP avant d'enregistrer ou d'appliquer.",
      nameRequired: "Saisissez un nom avant d'enregistrer le préhenseur.",
      updated: "Le préhenseur a été mis à jour.",
      saved: "Le préhenseur a été enregistré.",
      modelImported: "Modèle importé. Cliquez sur la surface pour définir le TCP.",
      tcpDefined: "TCP défini. Ajustez sa position ou son orientation si nécessaire."
    },
    pieceDialog: {
      title: "Nouvelle pièce",
      subtitle: "Définissez une géométrie ou importez un modèle 3D.",
      library: "Bibliothèque de pièces",
      list: "Liste",
      deleteTemplate: "Supprimer le modèle",
      characteristics: "Caractéristiques",
      pieceName: "Nom de la pièce",
      bottomFace: "Face inférieure de la pièce",
      model: "Modèle",
      calculatedDimensions: "Dimensions calculées",
      pieceType: "Type de pièce",
      rectangular: "Rectangulaire",
      trapezoidal: "Trapézoïdale",
      width: "Largeur",
      height: "Hauteur",
      depth: "Profondeur",
      topWidth: "Largeur supérieure",
      topDepth: "Profondeur supérieure",
      saveCharacteristics: "Enregistrer le nom et les caractéristiques",
      preview3D: "Aperçu 3D",
      createPiece: "Créer la pièce",
      invalidDimensions: "Les dimensions calculées ne sont pas valides.",
      nameRequired: "Saisissez un nom avant d'enregistrer la pièce.",
      templateUpdated: "Le modèle a été mis à jour.",
      templateSaved: "Le modèle a été enregistré.",
      templateDeleted: "Le modèle a été supprimé.",
      modelImported: "Modèle importé. Vérifiez son orientation, saisissez le nom, puis créez ou enregistrez la pièce.",
      bottomFaces: {
        NEGATIVE_Y: "Face inférieure actuelle (-Y)",
        POSITIVE_Y: "Face supérieure actuelle (+Y)",
        NEGATIVE_X: "Face gauche actuelle (-X)",
        POSITIVE_X: "Face droite actuelle (+X)",
        NEGATIVE_Z: "Face arrière actuelle (-Z)",
        POSITIVE_Z: "Face avant actuelle (+Z)"
      }
    },
    pieces: {
      title: "CONFIGURATEUR DE PIÈCES",
      new: "Nouvelle pièce",
      duplicate: "Dupliquer",
      delete: "Supprimer",
      selected: "PIÈCE SÉLECTIONNÉE",
      defaultName: "Pièce",
      position: "Position de la pièce"
    },
    separatorDialog: {
      title: "Nouveau séparateur",
      subtitle: "Séparateur rectangulaire avec référence TCP fixe sur TOP_CENTER.",
      close: "Fermer",
      library: "Bibliothèque de séparateurs",
      list: "Liste",
      deleteTemplate: "Supprimer le modèle",
      import3D: "Importer en 3D",
      characteristics: "Caractéristiques",
      widthX: "Largeur X",
      depthY: "Profondeur Y",
      thicknessZ: "Épaisseur Z",
      color: "Couleur",
      saveCharacteristics: "Enregistrer le nom et les caractéristiques",
      preview3D: "Aperçu 3D",
      previewHelp: "La sphère verte représente TOP_CENTER. L’axe X est rouge, l’axe Y est vert et l’axe Z bleu indique la direction d’attaque.",
      createSeparator: "Créer le séparateur",
      invalidDimensions: "La largeur, la profondeur et l’épaisseur doivent être des nombres supérieurs à zéro.",
      nameRequired: "Saisissez un nom avant d’enregistrer le séparateur.",
      saveError: "Impossible d’enregistrer le séparateur.",
      separatorUpdated: "Le séparateur a été mis à jour.",
      separatorSaved: "Le séparateur a été enregistré.",
      loaded: (name) => `Séparateur chargé : ${name}`,
      deleteError: "Impossible de supprimer le séparateur.",
      deletedFromLibrary: "Le séparateur a été supprimé de la bibliothèque.",
      importLater: "L’importation 3D sera programmée lors d’une phase ultérieure."
    },
    separators: {
      title: "CONFIGURATEUR DE SÉPARATEURS",
      new: "Nouveau séparateur",
      duplicate: "Dupliquer",
      delete: "Supprimer",
      selected: "SÉPARATEUR SÉLECTIONNÉ",
      defaultName: "Séparateur",
      position: "Position du séparateur"
    },
    layer: {
      title: "CONFIGURATEUR DE COUCHES",
      newEmpty: "Nouvelle couche vide",
      save: "Enregistrer la couche",
      placeholder: "Exemple : Couche paire",
      idsOn: "ID activés",
      idsOff: "ID désactivés",
      gripperOffsets: "Décalages du préhenseur",
      unsavedComposition: "La composition actuelle contient des modifications de couche non enregistrées.",
      savedLayers: "Couches enregistrées",
      noSavedLayers: "Aucune couche n'est encore enregistrée.",
      deleteTitle: "Supprimer la couche",
      deleteQuestion: (name) =>
        `Voulez-vous vraiment supprimer la couche "${name}" ?`,
      defaultName: (number) => `Couche ${number}`,
      idErrorTitle: "Impossible d'enregistrer la couche",
      idCorrection: "Corrigez les ID et réessayez.",
      idConsecutive: (maximum) =>
        `Les ID doivent être consécutifs de 1 à ${maximum}.`,
      idEmpty: (count) => `${count} élément(s) sans ID.`,
      idInvalid: (count) =>
        `${count} élément(s) ont un ID qui n'est pas un entier positif.`,
      idDuplicate: (count) =>
        `${count} élément(s) partagent un ID en double.`
    },
    reference: {
      robotTcp: "Référence TCP du robot",
      contactFace: "Face de contact",
      orientation: "Orientation de référence",
      faceOffsetX: "Face Offset X",
      faceOffsetY: "Face Offset Y",
      faceRotation: "Face Rotation",
      refRx: "Ref RX",
      refRy: "Ref RY",
      refRz: "Ref RZ",
      points: {
        CENTER: "Centre",
        TOP_CENTER: "Centre supérieur",
        BOTTOM_CENTER: "Centre inférieur",
        LEFT_CENTER: "Centre gauche",
        RIGHT_CENTER: "Centre droit",
        FRONT_CENTER: "Centre avant",
        BACK_CENTER: "Centre arrière"
      }
    },
    layerUi: {
      title: "CONFIGURATEUR DE COUCHES", newEmpty: "Nouvelle couche vide", save: "Enregistrer la couche", placeholder: "Exemple : Couche paire",
      idsOn: "ID activés", idsOff: "ID désactivés", gripperOffsets: "Décalages du préhenseur",
      unsavedComposition: "La composition actuelle contient des modifications de couche non enregistrées."
    },
    unsavedLayer: {
      title: "Couche non enregistrée", message: (name) => name ? `La composition actuelle de la couche « ${name} » contient des modifications non enregistrées. Vous pouvez l’enregistrer avant de charger une autre couche ou ignorer les modifications.` : "La composition actuelle contient des modifications non enregistrées. Vous pouvez l’enregistrer avant de charger une autre couche ou ignorer les modifications.", discard: "Ignorer les modifications"
    },
    orderIds: { errorAria: "Erreur d'identifiants" },
    gripperOffsets: {
      generic: "Décalages génériques", piece: (id) => "Décalages de la pièce ID " + id,
      custom: "Cette pièce utilise des décalages personnalisés.", inherited: "Cette pièce hérite des décalages génériques.",
      approach: "Décalage d’approche", retreat: "Décalage de retrait", useGeneric: "Utiliser les décalages génériques"
    },
    palletizing: {
      title: "CONFIGURATEUR DE PALETTISATION",
      availableLayers: "Couches disponibles",
      saveLayerFirst: "Vous devez d’abord enregistrer une couche.",
      addLayer: (name) => "Ajouter " + name,
      sequence: "Séquence de palettisation",
      noLayersAdded: "Vous n’avez encore ajouté aucune couche.",
      layerUnavailable: "Couche indisponible",
      deleteHelp: "Sélectionnez une couche de la séquence ou un bloc 3D, puis appuyez sur Suppr pour le supprimer."
    },
    common: {
      id: "ID",
      name: "Nom",
      yes: "Oui",
      no: "Non",
      accept: "Accepter",
      confirm: "Confirmer",
      cancel: "Annuler",
      x: "X",
      y: "Y",
      z: "Z",
      rx: "RX",
      ry: "RY",
      rz: "RZ"
    },
    configurators: {
      gripper: "Configurateur de préhenseur",
      pallet: "Configurateur de palette",
      pieces: "Configurateur de pièces",
      separators: "Configurateur de séparateurs",
      layers: "Configurateur de couches",
      palletizing: "Configurateur de palettisation"
    }
  },
  ar: {
    project: {
      unnamed: "مشروع بدون اسم",
      recovered: "مشروع مستعاد",
      saved: "تم حفظ المشروع",
      unsavedChanges: "تغييرات غير محفوظة"
    },
    projectMenu: {
      title: "المشروع",
      saved: "تم حفظ المشروع",
      unsaved: "تغييرات غير محفوظة",
      newProject: "مشروع جديد",
      openProject: "فتح مشروع",
      save: "حفظ",
      saveAs: "حفظ باسم..."
    },
    palletDialog: {
      configure: "إعداد المنصة",
      subtitle: "حدد المنصة الوحيدة للمحاكي.",
      close: "إغلاق",
      library: "مكتبة المنصات",
      list: "القائمة",
      deleteTemplate: "حذف القالب",
      import3D: "استيراد ثلاثي الأبعاد",
      characteristics: "الخصائص",
      palletName: "اسم المنصة",
      namePlaceholder: "مثال: منصة أوروبية",
      sizeX: "الحجم X",
      sizeY: "الحجم Y",
      sizeZ: "الحجم Z",
      color: "اللون",
      saveCharacteristics: "حفظ الاسم والخصائص",
      preview3D: "معاينة ثلاثية الأبعاد",
      surfaceHelp: "يتوافق السطح العلوي دائمًا مع Z WORLD = 0.",
      applyPallet: "تطبيق المنصة",
      invalidDimensions: "يجب أن تكون الأبعاد X وY وZ أرقامًا أكبر من صفر.",
      nameRequired: "اكتب اسمًا قبل حفظ المنصة.",
      saveError: "تعذر حفظ المنصة.",
      templateUpdated: "تم تحديث قالب المنصة.",
      templateSaved: "تم حفظ قالب المنصة.",
      applied: (name) => `تم تطبيق المنصة: ${name}`,
      selectBeforeDelete: "حدد قالبًا قبل حذفه.",
      deleteError: "تعذر حذف القالب.",
      templateDeleted: "تم حذف قالب المنصة."
    },
    gripperPanel: {
      title: "إعداد القابض",
      newGripper: "قابض جديد",
      showGripper: "إظهار القابض",
      hideGripper: "إخفاء القابض"
    },
    gripperDialog: {
      title: "إعداد القابض",
      subtitle: "استورد النموذج وحدد نقطة TCP على سطحه.",
      library: "مكتبة القوابض",
      list: "القائمة",
      deleteGripper: "حذف القابض",
      characteristics: "الخصائص",
      sizeX: "الحجم X",
      sizeY: "الحجم Y",
      sizeZ: "الحجم Z",
      offsetX: "الإزاحة X",
      offsetY: "الإزاحة Y",
      robotFront: "واجهة الروبوت",
      localTcp: "TCP المحلي",
      selectTcp: "تحديد TCP على النموذج",
      selectingTcp: "جارٍ تحديد TCP...",
      position: "الموضع",
      saveCharacteristics: "حفظ الاسم والخصائص",
      preview3D: "معاينة ثلاثية الأبعاد",
      applyGripper: "تطبيق القابض",
      import3D: "استيراد ثلاثي الأبعاد",
      importing: "جارٍ الاستيراد...",
      modelUnits: "وحدات النموذج ثلاثي الأبعاد",
      importError: "تعذر استيراد النموذج ثلاثي الأبعاد.",
      invalidSizes: "يجب أن تكون الأحجام X وY وZ أكبر من صفر.",
      invalidOffsets: "يجب أن تكون الإزاحات وواجهة الروبوت أرقامًا صالحة.",
      modelAndTcpRequired: "استورد النموذج وحدد TCP قبل الحفظ أو التطبيق.",
      nameRequired: "اكتب اسمًا قبل حفظ القابض.",
      updated: "تم تحديث القابض.",
      saved: "تم حفظ القابض.",
      modelImported: "تم استيراد النموذج. انقر على السطح لتحديد TCP.",
      tcpDefined: "تم تحديد TCP. اضبط الموضع أو الاتجاه عند الحاجة."
    },
    pieceDialog: {
      title: "قطعة جديدة",
      subtitle: "حدد شكلًا هندسيًا أو استورد نموذجًا ثلاثي الأبعاد.",
      library: "مكتبة القطع",
      list: "القائمة",
      deleteTemplate: "حذف القالب",
      characteristics: "الخصائص",
      pieceName: "اسم القطعة",
      bottomFace: "الوجه السفلي للقطعة",
      model: "النموذج",
      calculatedDimensions: "الأبعاد المحسوبة",
      pieceType: "نوع القطعة",
      rectangular: "مستطيلة",
      trapezoidal: "شبه منحرفة",
      width: "العرض",
      height: "الارتفاع",
      depth: "العمق",
      topWidth: "العرض العلوي",
      topDepth: "العمق العلوي",
      saveCharacteristics: "حفظ الاسم والخصائص",
      preview3D: "معاينة ثلاثية الأبعاد",
      createPiece: "إنشاء قطعة",
      invalidDimensions: "الأبعاد المحسوبة غير صالحة.",
      nameRequired: "اكتب اسمًا قبل حفظ القطعة.",
      templateUpdated: "تم تحديث القالب.",
      templateSaved: "تم حفظ القالب.",
      templateDeleted: "تم حذف القالب.",
      modelImported: "تم استيراد النموذج. راجع الاتجاه، واكتب الاسم، ثم أنشئ القطعة أو احفظها.",
      bottomFaces: {
        NEGATIVE_Y: "الوجه السفلي الحالي (-Y)",
        POSITIVE_Y: "الوجه العلوي الحالي (+Y)",
        NEGATIVE_X: "الوجه الأيسر الحالي (-X)",
        POSITIVE_X: "الوجه الأيمن الحالي (+X)",
        NEGATIVE_Z: "الوجه الخلفي الحالي (-Z)",
        POSITIVE_Z: "الوجه الأمامي الحالي (+Z)"
      }
    },
    pieces: {
      title: "إعداد القطع",
      new: "قطعة جديدة",
      duplicate: "تكرار",
      delete: "حذف",
      selected: "القطعة المحددة",
      defaultName: "قطعة",
      position: "موضع القطعة"
    },
    separatorDialog: {
      title: "فاصل جديد",
      subtitle: "فاصل مستطيل بمرجع TCP ثابت عند TOP_CENTER.",
      close: "إغلاق",
      library: "مكتبة الفواصل",
      list: "القائمة",
      deleteTemplate: "حذف القالب",
      import3D: "استيراد ثلاثي الأبعاد",
      characteristics: "الخصائص",
      widthX: "العرض X",
      depthY: "العمق Y",
      thicknessZ: "السماكة Z",
      color: "اللون",
      saveCharacteristics: "حفظ الاسم والخصائص",
      preview3D: "معاينة ثلاثية الأبعاد",
      previewHelp: "تمثل الكرة الخضراء TOP_CENTER. المحور X أحمر، والمحور Y أخضر، والمحور Z الأزرق يوضح اتجاه الاقتراب.",
      createSeparator: "إنشاء فاصل",
      invalidDimensions: "يجب أن يكون العرض والعمق والسماكة أرقامًا أكبر من صفر.",
      nameRequired: "اكتب اسمًا قبل حفظ الفاصل.",
      saveError: "تعذر حفظ الفاصل.",
      separatorUpdated: "تم تحديث الفاصل.",
      separatorSaved: "تم حفظ الفاصل.",
      loaded: (name) => `تم تحميل الفاصل: ${name}`,
      deleteError: "تعذر حذف الفاصل.",
      deletedFromLibrary: "تمت إزالة الفاصل من المكتبة.",
      importLater: "سيتم تنفيذ الاستيراد ثلاثي الأبعاد في مرحلة لاحقة."
    },
    separators: {
      title: "إعداد الفواصل",
      new: "فاصل جديد",
      duplicate: "تكرار",
      delete: "حذف",
      selected: "الفاصل المحدد",
      defaultName: "فاصل",
      position: "موضع الفاصل"
    },
    layer: {
      title: "إعداد الطبقات",
      newEmpty: "طبقة فارغة جديدة",
      save: "حفظ الطبقة",
      placeholder: "مثال: طبقة زوجية",
      idsOn: "المعرفات مفعلة",
      idsOff: "المعرفات معطلة",
      gripperOffsets: "إزاحات القابض",
      unsavedComposition: "يحتوي التكوين الحالي على تغييرات طبقة غير محفوظة.",
      savedLayers: "الطبقات المحفوظة",
      noSavedLayers: "لا توجد طبقات محفوظة حتى الآن.",
      deleteTitle: "حذف الطبقة",
      deleteQuestion: (name) =>
        `هل أنت متأكد من حذف الطبقة "${name}"؟`,
      defaultName: (number) => `طبقة ${number}`,
      idErrorTitle: "لا يمكن حفظ الطبقة",
      idCorrection: "صحح المعرفات وحاول مرة أخرى.",
      idConsecutive: (maximum) =>
        `يجب أن تكون المعرفات متتالية من 1 إلى ${maximum}.`,
      idEmpty: (count) => `${count} عنصر بدون معرف.`,
      idInvalid: (count) =>
        `${count} عنصر لديه معرف ليس عددًا صحيحًا موجبًا.`,
      idDuplicate: (count) =>
        `${count} عنصر يشترك في معرف مكرر.`
    },
    reference: {
      robotTcp: "مرجع TCP للروبوت",
      contactFace: "وجه التلامس",
      orientation: "اتجاه المرجع",
      faceOffsetX: "Face Offset X",
      faceOffsetY: "Face Offset Y",
      faceRotation: "Face Rotation",
      refRx: "Ref RX",
      refRy: "Ref RY",
      refRz: "Ref RZ",
      points: {
        CENTER: "المركز",
        TOP_CENTER: "المركز العلوي",
        BOTTOM_CENTER: "المركز السفلي",
        LEFT_CENTER: "المركز الأيسر",
        RIGHT_CENTER: "المركز الأيمن",
        FRONT_CENTER: "المركز الأمامي",
        BACK_CENTER: "المركز الخلفي"
      }
    },
    layerUi: {
      title: "إعداد الطبقات", newEmpty: "طبقة فارغة جديدة", save: "حفظ الطبقة", placeholder: "مثال: طبقة زوجية",
      idsOn: "المعرفات مفعلة", idsOff: "المعرفات معطلة", gripperOffsets: "إزاحات القابض",
      unsavedComposition: "يحتوي التكوين الحالي على تغييرات طبقة غير محفوظة."
    },
    unsavedLayer: {
      title: "طبقة غير محفوظة", message: (name) => name ? `يحتوي التكوين الحالي للطبقة «${name}» على تغييرات غير محفوظة. يمكنك حفظه قبل تحميل طبقة أخرى أو تجاهل التغييرات.` : "يحتوي التكوين الحالي على تغييرات غير محفوظة. يمكنك حفظه قبل تحميل طبقة أخرى أو تجاهل التغييرات.", discard: "تجاهل التغييرات"
    },
    orderIds: { errorAria: "خطأ في المعرفات" },
    gripperOffsets: {
      generic: "إزاحات عامة", piece: (id) => "إزاحات القطعة ذات المعرف " + id,
      custom: "تستخدم هذه القطعة إزاحات مخصصة.", inherited: "ترث هذه القطعة الإزاحات العامة.",
      approach: "إزاحة الاقتراب", retreat: "إزاحة الابتعاد", useGeneric: "استخدام الإزاحات العامة"
    },
    palletizing: {
      title: "إعداد الرص على المنصة",
      availableLayers: "الطبقات المتاحة",
      saveLayerFirst: "يجب حفظ طبقة أولًا.",
      addLayer: (name) => "إضافة " + name,
      sequence: "تسلسل الرص على المنصة",
      noLayersAdded: "لم تتم إضافة أي طبقة بعد.",
      layerUnavailable: "الطبقة غير متاحة",
      deleteHelp: "حدد طبقة من التسلسل أو كتلة ثلاثية الأبعاد واضغط على Delete لحذفها."
    },
    common: {
      id: "المعرف",
      name: "الاسم",
      yes: "نعم",
      no: "لا",
      accept: "قبول",
      confirm: "تأكيد",
      cancel: "إلغاء",
      x: "X",
      y: "Y",
      z: "Z",
      rx: "RX",
      ry: "RY",
      rz: "RZ"
    },
    configurators: {
      gripper: "إعداد القابض",
      pallet: "إعداد المنصة",
      pieces: "إعداد القطع",
      separators: "إعداد الفواصل",
      layers: "إعداد الطبقات",
      palletizing: "إعداد الرص على المنصة"
    }
  }
};

function mergeTranslations(baseValue, overrideValue) {
  if (
    typeof baseValue !== "object" ||
    baseValue === null ||
    Array.isArray(baseValue)
  ) {
    return overrideValue ?? baseValue;
  }

  const result = {
    ...baseValue
  };

  Object.keys(overrideValue ?? {}).forEach((key) => {
    result[key] = mergeTranslations(
      baseValue[key],
      overrideValue[key]
    );
  });

  return result;
}

export function getTranslator(languageCode = "ca") {
  const selectedTranslations =
    translations[languageCode] ??
    translations.ca;

  return mergeTranslations(
    translations.ca,
    selectedTranslations
  );
}

export function getLanguageDirection(languageCode = "ca") {
  return (
    SUPPORTED_LANGUAGES.find(
      (language) =>
        language.code === languageCode
    )?.direction ?? "ltr"
  );
}

export default translations;
