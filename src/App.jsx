//App.jsx
//Motor 3D
import   { Canvas }   from   "@react-three/fiber";

//controls de camera
import { OrbitControls } from "@react-three/drei";
import {useEffect, useRef, useState } from "react";
import Pallet from "./components/Pallet.jsx";
import DraggablePiece from "./components/DraggablePiece.jsx";
import NewPieceDialog from "./components/NewPieceDialog.jsx";
import PalletWorldAxes from "./components/PalletWorldAxes.jsx";
import {PALLET_CONFIG} from "./Config/geometryConfig";
import PalletDialog from "./components/PalletDialog.jsx";
import ProjectMenu from "./components/ProjectMenu.jsx";
import OpenProjectDialog from "./components/OpenProjectDialog.jsx";
import SaveProjectDialog from "./components/SaveProjectDialog.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import FloorGrid from "./components/FloorGrid.jsx";



import {createProjectId, saveProject } from "./utils/projectStorage";

import { isPieceCollidingWithPallet, isPieceOutsidePallet, isPieceCollidingWithPiece } from "./utils/collision";
import { getDisplayedCoordinates, displayedToCenterCoordinates, getReferenceRobotEuler, threeToPallet} from "./utils/pieceUtils";

const REFERENCE_POINT_OPTIONS = [
  {
    value: "CENTER",
    label: "CENTER"
  },
  {
    value: "TOP_CENTER",
    label: "TOP_CENTER"
  },
  {
    value: "BOTTOM_CENTER",
    label: "BOTTOM_CENTER"
  },

  /*
    La geometria interna considera +X pallet
    com FRONT.

    Visualment, al teu pallet, aquest costat
    correspon al que anomenes BACK.
  */
  {
    value: "BACK_CENTER",
    label: "FRONT_CENTER"
  },
  {
    value: "FRONT_CENTER",
    label: "BACK_CENTER"
  },
  {
    value: "LEFT_CENTER",
    label: "LEFT_CENTER"
  },
  {
    value: "RIGHT_CENTER",
    label: "RIGHT_CENTER"
  }
];

function getReferencePointLabel(
  referencePoint
) {

  const option =
    REFERENCE_POINT_OPTIONS.find(
      (item) =>
        item.value ===
        referencePoint
    );

  return (
    option?.label ??
    referencePoint
  );

}

const panelSectionStyle = {
  padding: "12px",
  border: "1px solid #d7dce1",
  borderRadius: "7px",
  background: "#ffffff"
};

const panelFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  marginBottom: "8px",
  color: "#404850",
  fontSize: "13px",
  fontWeight: 600
};

const panelInputStyle = {
  width: "100%",
  height: "31px",
  boxSizing: "border-box",
  padding: "0 7px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#20262c",
  fontSize: "13px"
};

const readOnlyInputStyle = {
  ...panelInputStyle,
  background: "#eef1f4",
  color: "#34404b",
  cursor: "default"
};

const panelSelectStyle = {
  width: "100%",
  height: "33px",
  boxSizing: "border-box",
  padding: "0 7px",
  border: "1px solid #aeb6bf",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#20262c",
  fontSize: "13px",
  cursor: "pointer"
};

const panelButtonStyle = {
  flex: 1,
  minWidth: 0,
  height: "34px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: "1px solid #aeb6bf",
  borderRadius: "6px",
  background: "#f7f8fa",
  color: "#303840",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.08)"
};


const panelRowStyle = {
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  marginBottom: "7px",
  color: "#404850",
  fontSize: "13px",
  fontWeight: 600
};






const AUTOSAVE_STORAGE_KEY =
  "pallet-simulator-composition";

function loadAutosave() {
  try {
    const savedValue =
      window.localStorage.getItem(
        AUTOSAVE_STORAGE_KEY
      );

    if (!savedValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(savedValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object"
    ) {
      return null;
    }

    const savedPieces =
      Array.isArray(
        parsedValue.pieces
      )
        ? parsedValue.pieces
        : [];

    const savedPallet =
      parsedValue.activePallet &&
      typeof parsedValue.activePallet ===
        "object"
        ? parsedValue.activePallet
        : null;

    return {
      pieces: savedPieces,

      activePallet:
        savedPallet,

      selectedPieceId:
        parsedValue.selectedPieceId ??
        null,

      activeProject:
        parsedValue.activeProject &&
        typeof parsedValue.activeProject ===
          "object"
          ? parsedValue.activeProject
          : null,

      savedAt:
        parsedValue.savedAt ??
        null
    };
  } catch (error) {
    console.error(
      "No s'ha pogut carregar la còpia de recuperació:",
      error
    );

    return null;
  }
}




function saveAutosave(
  pieces,
  activePallet,
  selectedPieceId,
  activeProject
) {
  try {
    const autosaveData = {
      version: 1,

      savedAt:
        new Date().toISOString(),

      pieces,

      activePallet,

      selectedPieceId,

      activeProject
    };

    window.localStorage.setItem(
      AUTOSAVE_STORAGE_KEY,
      JSON.stringify(
        autosaveData
      )
    );

    return true;
  } catch (error) {
    console.error(
      "No s'ha pogut guardar la còpia de recuperació:",
      error
    );

    return false;
  }
}


const configuratorButtonStyle = {
  width: "100%",
  height: "34px",
  boxSizing: "border-box",
  padding: "0 10px",
  border: "1px solid #aeb6bf",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#303840",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.08)"
};







export default function App() {
  

  const [
  selectedPieceId,
  setSelectedPieceId
] = useState(null);

  const [
    isDragging,
    setIsDragging
  ] = useState(false);

  const [
    isNewPieceDialogOpen,
    setIsNewPieceDialogOpen
  ] = useState(false);

  const [
    isPalletDialogOpen,
    setIsPalletDialogOpen
  ] = useState(false);

  const [
  isOpenProjectDialogOpen,
  setIsOpenProjectDialogOpen
] = useState(false);

const [
  activeConfigurator,
  setActiveConfigurator
] = useState(null);

const [
  isLanguageMessageVisible,
  setIsLanguageMessageVisible
] = useState(false);

const [
  isSaveProjectDialogOpen,
  setIsSaveProjectDialogOpen
] = useState(false);

const [
  saveProjectSuggestedName,
  setSaveProjectSuggestedName
] = useState("");

const [
  confirmDialog,
  setConfirmDialog
] = useState({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirmar",
  destructive: false
});

  const [
    inputX,
    setInputX
  ] = useState("");

  const [
    inputY,
    setInputY
  ] = useState("");

  const [
    inputZ,
    setInputZ
  ] = useState("");

  const [
    inputRX,
    setInputRX
  ] = useState("");

  const [
    inputRY,
    setInputRY
  ] = useState("");

  const [
    inputRZ,
    setInputRZ
  ] = useState("");

  const [
  pieces,
  setPieces
] = useState([]);

  const [
  activePallet,
  setActivePallet
] = useState(() => ({
  ...PALLET_CONFIG
}));


  const [
    activeProject,
    setActiveProject
  ] = useState({
    id: null,
    name: "Projecte sense nom",
    createdAt: null
  });

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges
  ] = useState(false);

const [
  hasHandledAutosaveRecovery,
  setHasHandledAutosaveRecovery
] = useState(false);



  /*
    Aquesta referència ha d'estar dins
    del component App.
  */
  
const hasCompletedInitialRender =
  useRef(false);

const suppressNextChangeDetection =
  useRef(false);

const confirmActionRef =
  useRef(null);


function applyRecoveredAutosave(
  autosaveData
) {
  
  

  const recoveredPieces =
    Array.isArray(
      autosaveData.pieces
    )
      ? autosaveData.pieces.map(
          (piece) => ({
            ...piece
          })
        )
      : [];

  const recoveredPallet =
    autosaveData.activePallet
      ? {
          ...autosaveData.activePallet
        }
      : {
          ...PALLET_CONFIG
        };

  const recoveredSelectedPieceId =
    recoveredPieces.some(
      (piece) =>
        piece.id ===
        autosaveData.selectedPieceId
    )
      ? autosaveData.selectedPieceId
      : null;

  setPieces(
    recoveredPieces
  );

  setActivePallet(
    recoveredPallet
  );

  setSelectedPieceId(
    recoveredSelectedPieceId
  );

  if (
    autosaveData.activeProject
  ) {
    setActiveProject({
      id:
        autosaveData.activeProject.id ??
        null,

      name:
        autosaveData.activeProject.name ??
        "Projecte recuperat",

      createdAt:
        autosaveData.activeProject.createdAt ??
        null
    });
  } else {
    setActiveProject({
      id: null,
      name: "Projecte recuperat",
      createdAt: null
    });
  }

  setHasUnsavedChanges(true);
}

/*
  1. Comprova si existeix una sessió
  anterior recuperable.

  Aquest efecte només s'executa una vegada
  quan s'obre l'aplicació.
*/
useEffect(() => {
  const autosaveData =
    loadAutosave();

  if (!autosaveData) {
    setHasHandledAutosaveRecovery(
      true
    );

    return;
  }

  const hasSavedPieces =
    Array.isArray(
      autosaveData.pieces
    ) &&
    autosaveData.pieces.length > 0;

  const savedPalletString =
    JSON.stringify(
      autosaveData.activePallet
    );

  const defaultPalletString =
    JSON.stringify(
      PALLET_CONFIG
    );

  const hasDifferentPallet =
    autosaveData.activePallet &&
    savedPalletString !==
      defaultPalletString;

  const hasRecoverableContent =
    hasSavedPieces ||
    hasDifferentPallet;

  if (!hasRecoverableContent) {
    window.localStorage.removeItem(
      AUTOSAVE_STORAGE_KEY
    );

    setHasHandledAutosaveRecovery(
      true
    );

    return;
  }

  const shouldRecover =
    window.confirm(
      "S'ha trobat una sessió anterior sense guardar. Vols recuperar-la?"
    );

  if (shouldRecover) {
    applyRecoveredAutosave(
      autosaveData
    );
  } else {
    window.localStorage.removeItem(
      AUTOSAVE_STORAGE_KEY
    );
  }

  setHasHandledAutosaveRecovery(
    true
  );
}, []);






/*
  Detecta canvis físics a la composició
  i guarda una còpia de recuperació.
*/
useEffect(() => {
  if (!hasHandledAutosaveRecovery) {
    return;
  }

  /*
    La primera execució després de comprovar
    la recuperació no és una modificació
    feta per l'usuari.
  */
  if (!hasCompletedInitialRender.current) {
    hasCompletedInitialRender.current = true;
    return;
  }

  /*
    Crear un projecte nou o obrir un projecte
    guardat tampoc és una modificació manual.
  */
  if (suppressNextChangeDetection.current) {
    suppressNextChangeDetection.current = false;
    return;
  }

  setHasUnsavedChanges(true);

  saveAutosave(
    pieces,
    activePallet,
    selectedPieceId,
    activeProject
  );
}, [
  pieces,
  activePallet
]);


/*
  Actualitza la peça seleccionada dins de
  la còpia de recuperació existent.
*/
useEffect(() => {
  if (!hasHandledAutosaveRecovery) {
    return;
  }

  if (!hasUnsavedChanges) {
    return;
  }

  saveAutosave(
    pieces,
    activePallet,
    selectedPieceId,
    activeProject
  );
}, [
  selectedPieceId
]);


/*
  Fa un últim guardat abans de tancar
  o recarregar la pàgina.
*/
useEffect(() => {
  function handleBeforeUnload() {
    if (!hasUnsavedChanges) {
      return;
    }

    saveAutosave(
      pieces,
      activePallet,
      selectedPieceId,
      activeProject
    );
  }

  window.addEventListener(
    "beforeunload",
    handleBeforeUnload
  );

  return () => {
    window.removeEventListener(
      "beforeunload",
      handleBeforeUnload
    );
  };
}, [
  pieces,
  activePallet,
  selectedPieceId,
  activeProject,
  hasUnsavedChanges
]);






  const selectedData =
    pieces.find(
      (piece) =>
        piece.id ===
        selectedPieceId
    );

useEffect(() => {
  function handleGlobalKeyDown(event) {
    const activeElement =
      document.activeElement;

    const isWritingInField =
      activeElement instanceof
        HTMLInputElement ||
      activeElement instanceof
        HTMLTextAreaElement ||
      activeElement instanceof
        HTMLSelectElement ||
      activeElement?.isContentEditable ===
        true;

    /*
      Si s'està editant un camp,
      no executem les dreceres globals.
    */
    if (isWritingInField) {
      return;
    }

    /*
      Detectem automàticament qualsevol
      popup modal obert.

      Això inclou:
      - Nova peça
      - Configurar palet
      - Obrir projecte
      - Guardar projecte
      - Confirmacions
      - Qualsevol popup futur
    */
    const openDialog =
      document.querySelector(
        '[role="dialog"][aria-modal="true"]'
      );

    if (openDialog) {
      return;
    }

    /*
      Escape deselecciona la peça.
    */
    if (event.key === "Escape") {
      if (selectedPieceId === null) {
        return;
      }

      event.preventDefault();

      setSelectedPieceId(null);

      setInputX("");
      setInputY("");
      setInputZ("");
      setInputRX("");
      setInputRY("");
      setInputRZ("");

      return;
    }

    /*
      Delete correspon habitualment
      a la tecla Supr.
    */
    if (event.key === "Delete") {
      if (selectedPieceId === null) {
        return;
      }

      event.preventDefault();

      setPieces(
        (currentPieces) =>
          currentPieces.filter(
            (piece) =>
              piece.id !==
              selectedPieceId
          )
      );

      setSelectedPieceId(null);

      setInputX("");
      setInputY("");
      setInputZ("");
      setInputRX("");
      setInputRY("");
      setInputRZ("");
    }
  }

  window.addEventListener(
    "keydown",
    handleGlobalKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleGlobalKeyDown
    );
  };
}, [
  selectedPieceId
]);
``

const referenceEuler =
  selectedData
    ? getReferenceRobotEuler(
        selectedData
      )
    : {
        rx: 0,
        ry: 0,
        rz: 0
      };


useEffect(() => {
if (selectedData) {

  const displayed =
    getDisplayedCoordinates(selectedData);
    setInputX(String(displayed.x));
    setInputY(String(displayed.y));
    setInputZ(String(displayed.z));
    setInputRX(String(selectedData.rxDeg));
    setInputRY(String(selectedData.ryDeg));
    setInputRZ(String(selectedData.rzDeg));
}
}, [
  selectedPieceId,
  selectedData?.x,
  selectedData?.y,
  selectedData?.z,
  selectedData?.rxDeg,
  selectedData?.ryDeg,
  selectedData?.rzDeg,
  selectedData?.referencePoint,
  selectedData?.faceOffsetX,
  selectedData?.faceOffsetY
]);

function updatePieceField(field, value) {
  if (value === "") return;

  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return;

  const positionFields = ["x", "y", "z"];

  const validatedValue = positionFields.includes(field)
    ? roundToThreeDecimals(numericValue)
    : numericValue;

  setPieces((currentPieces) =>
    currentPieces.map((piece) =>
      piece.id === selectedPieceId
        ? { ...piece, [field]: validatedValue } : piece
    )
  );
}

function updateDisplayedCoordinates(
  axis,
  displayedValue
) {

  if (displayedValue === "") return;

  const numericValue =
    parseFloat(displayedValue);

  if (isNaN(numericValue)) return;

  const displayed =
    getDisplayedCoordinates(
      selectedData
    );

  const converted =
    displayedToCenterCoordinates(
      selectedData,

      axis === "x"
        ? numericValue
        : displayed.x,

      axis === "y"
        ? numericValue
        : displayed.y,

      axis === "z"
        ? numericValue
        : displayed.z
    );

  setPieces((currentPieces) =>
    currentPieces.map((piece) =>
      piece.id === selectedPieceId
        ? {
            ...piece,

            x: roundToThreeDecimals(
              converted.x
            ),

            y: roundToThreeDecimals(
              converted.y
            ),

            z: roundToThreeDecimals(
              converted.z
            )
          }
        : piece
    )
  );
}

// Arrodoneix un valor a un màxim de 3 decimals
function roundToThreeDecimals(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

// Actualitza la posició d'una peça durant l'arrossegament
function movePiece(
  pieceId,
  threeX,
  threeZ
) {

  const pallet =
    threeToPallet(
      threeX,
      0,
      threeZ
    );

  setPieces((currentPieces) =>
    currentPieces.map((piece) =>
      piece.id === pieceId
        ? {
            ...piece,

            x: roundToThreeDecimals(
              pallet.x
            ),

            y: roundToThreeDecimals(
              pallet.y
            )

          }
        : piece
    )
  );
}

// Crea una peça nova al centre del palet



function openNewPieceDialog() {
  setIsNewPieceDialogOpen(
    true
  );
}

function openPalletDialog() {
  setIsPalletDialogOpen(
    true
  );
}

function selectConfigurator(
  configuratorName
) {
  setActiveConfigurator(
    configuratorName
  );
}




function openConfirmDialog({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm
}) {
  confirmActionRef.current =
    onConfirm;

  setConfirmDialog({
    open: true,
    title,
    message,
    confirmLabel,
    destructive
  });
}

function closeConfirmDialog() {
  confirmActionRef.current =
    null;

  setConfirmDialog(
    (currentDialog) => ({
      ...currentDialog,
      open: false
    })
  );
}

function confirmDialogAction() {
  const pendingAction =
    confirmActionRef.current;

  closeConfirmDialog();

  if (
    typeof pendingAction ===
    "function"
  ) {
    pendingAction();
  }
}



function buildCurrentProject({
  id,
  name,
  createdAt
}) {
  const currentDate =
    new Date().toISOString();

  return {
    id,
    name,

    createdAt:
      createdAt ??
      currentDate,

    updatedAt:
      currentDate,

    activePallet: {
      ...activePallet
    },

    pieces:
      pieces.map(
        (piece) => ({
          ...piece
        })
      ),

    selectedPieceId
  };
}

function saveCurrentProjectAs() {
  const suggestedName =
    activeProject.id
      ? `${activeProject.name} còpia`
      : "";

  setSaveProjectSuggestedName(
    suggestedName
  );

  setIsSaveProjectDialogOpen(
    true
  );
}


function confirmSaveCurrentProjectAs(
  projectName
) {
  const newProjectId =
    createProjectId();

  const projectToSave =
    buildCurrentProject({
      id: newProjectId,
      name: projectName,
      createdAt: null
    });

  const savedProject =
    saveProject(
      projectToSave
    );

  if (!savedProject) {
    window.alert(
      "No s'ha pogut guardar el projecte."
    );

    return;
  }

  setActiveProject({
    id: savedProject.id,
    name: savedProject.name,
    createdAt:
      savedProject.createdAt
  });

  setHasUnsavedChanges(false);

  window.localStorage.removeItem(
    AUTOSAVE_STORAGE_KEY
  );

  setIsSaveProjectDialogOpen(
    false
  );
}





function saveCurrentProject() {
  if (!activeProject.id) {
    saveCurrentProjectAs();
    return;
  }

  const projectToSave =
    buildCurrentProject({
      id: activeProject.id,
      name: activeProject.name,
      createdAt:
        activeProject.createdAt
    });

  const savedProject =
    saveProject(
      projectToSave
    );

  if (!savedProject) {
    window.alert(
      "No s'ha pogut guardar el projecte."
    );

    return;
  }

  setActiveProject({
    id: savedProject.id,
    name: savedProject.name,
    createdAt:
      savedProject.createdAt
  });

  setHasUnsavedChanges(false);


  window.localStorage.removeItem(
  AUTOSAVE_STORAGE_KEY
);
}



function createNewProject() {
  if (!hasUnsavedChanges) {
    resetToNewProject();
    return;
  }

  openConfirmDialog({
    title: "Crear un projecte nou",
    message:
      "Hi ha canvis sense guardar. Si continues, la composició actual es descartarà.",
    confirmLabel:
      "Descartar i continuar",
    destructive: true,
    onConfirm:
      resetToNewProject
  });
}





function resetToNewProject() {
 
  suppressNextChangeDetection.current =
  true;

  setPieces([]);

  setActivePallet({
    ...PALLET_CONFIG
  });

  setSelectedPieceId(null);

  setInputX("");
  setInputY("");
  setInputZ("");
  setInputRX("");
  setInputRY("");
  setInputRZ("");

  setActiveProject({
    id: null,
    name: "Projecte sense nom",
    createdAt: null
  });

  setHasUnsavedChanges(false);

window.localStorage.removeItem(
  AUTOSAVE_STORAGE_KEY
);

}










function showOpenProjectDialog() {
  setIsOpenProjectDialogOpen(
    true
  );
}

function openProjectDialog() {
  if (!hasUnsavedChanges) {
    showOpenProjectDialog();
    return;
  }

  openConfirmDialog({
    title: "Obrir un altre projecte",
    message:
      "Hi ha canvis sense guardar. Si continues, la composició actual es descartarà.",
    confirmLabel:
      "Descartar i obrir",
    destructive: true,
    onConfirm:
      showOpenProjectDialog
  });
}







function applyOpenedProject(
  project
) {
  suppressNextChangeDetection.current =
  true;

  const projectPieces =
    Array.isArray(
      project.pieces
    )
      ? project.pieces.map(
          (piece) => ({
            ...piece
          })
        )
      : [];

  const nextSelectedPieceId =
    projectPieces.some(
      (piece) =>
        piece.id ===
        project.selectedPieceId
    )
      ? project.selectedPieceId
      : null;

  setPieces(
    projectPieces
  );

  setActivePallet(
    project.activePallet
      ? {
          ...project.activePallet
        }
      : {
          ...PALLET_CONFIG
        }
  );

  setSelectedPieceId(
    nextSelectedPieceId
  );

  setActiveProject({
    id: project.id,
    name: project.name,
    createdAt:
      project.createdAt ??
      null
  });

  setHasUnsavedChanges(false);

  window.localStorage.removeItem(
  AUTOSAVE_STORAGE_KEY
);
  setIsOpenProjectDialogOpen(
    false
  );
}


function applyPallet(
  palletDefinition
) {
  setActivePallet({
    ...palletDefinition
  });
}


function createPieceFromDialog(
  pieceDefinition
) {
  const newId =
    pieces.length === 0
      ? 1
      : Math.max(
          ...pieces.map(
            (piece) => piece.id
          )
        ) + 1;

  const newPiece = {
    id: newId,

    /*
      Guardem el nom també dins de la
      peça creada.

      Això permetrà mostrar-lo o
      exportar-lo més endavant.
    */
    name:
      pieceDefinition.name ||
      `Peça ${newId}`,

    pieceType:
      pieceDefinition.pieceType,

    width:
      pieceDefinition.width,

    height:
      pieceDefinition.height,

    depth:
      pieceDefinition.depth,

    topWidth:
      pieceDefinition.topWidth,

    topDepth:
      pieceDefinition.topDepth,

    referencePoint: "CENTER",

    faceOffsetX: 0,
    faceOffsetY: 0,
    faceRotationDeg: 0,

    x: 0,
    y: 0,

    /*
      Conservem el mateix criteri
      que utilitzava addPiece().
    */
    z:
      pieceDefinition.height / 2,

    rxDeg: 0,
    ryDeg: 0,
    rzDeg: 0
  };

  setPieces(
    (currentPieces) => [
      ...currentPieces,
      newPiece
    ]
  );

  setSelectedPieceId(newId);

  setIsNewPieceDialogOpen(
    false
  );
}





// Duplica la peça seleccionada
function duplicatePiece() {
if (!selectedData) return;
const newId =
pieces.length === 0
? 1
: Math.max(...pieces.map((piece) => piece.id)) + 1;
const duplicatedPiece = {
...selectedData,
id: newId,
x: selectedData.x + 100

};
setPieces([...pieces, duplicatedPiece]);
setSelectedPieceId(newId);
}

// Elimina la peça seleccionada
function deletePiece() {
if (!selectedData) return;
setPieces(
pieces.filter((piece) => piece.id !== selectedPieceId)
);
setSelectedPieceId(null);
setInputX("");
setInputY("");
setInputZ("");
setInputRX("");
setInputRY("");
setInputRZ("");
}

function isPieceCollidingWithOtherPieces(piece) {
  console.log("COLLISION TEST", piece.id);

  return pieces.some(
    (otherPiece) =>
      otherPiece.id !== piece.id &&
      isPieceCollidingWithPiece(
        piece,
        otherPiece
      )
  );
}

console.log(pieces);


//escena 3D
 return (
  <>
  <Canvas 
    shadows
    style={{ width: "100vw", height: "100vh" }} camera={{ position: [2000, 1500, 2000], near: 1, far: 20000 }} >
    {/* Color de fons */}
    <color attach="background" args={["white"]} />
    <ambientLight intensity={0.8} />
    
    <directionalLight
    castShadow
    position={[1000, 2000, 1000]}
    intensity={1.5}
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
    shadow-camera-near={1}
    shadow-camera-far={6000}
    shadow-camera-left={-2500}
    shadow-camera-right={2500}
    shadow-camera-top={2500}
    shadow-camera-bottom={-2500}
/>  

    {/* Posició i mides del palet */}

{/* Palet */} 
<Pallet
  pallet={activePallet}
/>

{/* Eixos WORLD del palet */}
<PalletWorldAxes
  length={100}
/>

 
{/* Genera una peça 3D per cada registre de l'array */}


{pieces.map((piece) => (
  <DraggablePiece
    key={piece.id}
    piece={piece}
    selected={piece.id === selectedPieceId}
    colliding={isPieceCollidingWithPallet(piece, activePallet) || isPieceCollidingWithOtherPieces(piece)
}
    outside={isPieceOutsidePallet(piece, activePallet)}
    onSelect={setSelectedPieceId}
    onMove={movePiece}
    onDragStart={() => setIsDragging(true)}
    onDragEnd={() => setIsDragging(false)}
    
  />
))}

{/* Graella al terra */}
    
<FloorGrid
  palletHeight={
    activePallet.sizeZ
  }
/>



    <OrbitControls enabled={!isDragging} />
  </Canvas>

  <div
  style={{
    position: "absolute",
    top: "16px",
    left: "16px",
    width: "300px",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "14px",
    background: "#ffffff",
    border: "1px solid #c6ccd2",
    borderRadius: "10px",
    boxShadow:
      "0 12px 32px rgba(0, 0, 0, 0.22)",
    color: "#303840",
    fontFamily:
      "Arial, Helvetica, sans-serif"
  }}
>

<ProjectMenu
  projectName={
    activeProject.name
  }
  hasUnsavedChanges={
    hasUnsavedChanges
  }
  onNewProject={
    createNewProject
  }
  onOpenProject={
    openProjectDialog
  }
  onSaveProject={
    saveCurrentProject
  }
  onSaveProjectAs={
    saveCurrentProjectAs
  }
/>

<section
  style={{
    ...panelSectionStyle,
    marginBottom: "12px"
  }}
>


  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "7px"
    }}
  >
    <button
      type="button"
      onClick={() => {
        selectConfigurator(
          "gripper"
        );
      }}
      style={{
        ...configuratorButtonStyle,
        borderColor:
          activeConfigurator ===
          "gripper"
            ? "#2767c5"
            : "#aeb6bf",
        background:
          activeConfigurator ===
          "gripper"
            ? "#eef4fb"
            : "#ffffff",
        color:
          activeConfigurator ===
          "gripper"
            ? "#2767c5"
            : "#303840"
      }}
    >
      Configurador gripper
    </button>

    <button
      type="button"
      onClick={() => {
        selectConfigurator(
          "separators"
        );
      }}
      style={{
        ...configuratorButtonStyle,
        borderColor:
          activeConfigurator ===
          "separators"
            ? "#2767c5"
            : "#aeb6bf",
        background:
          activeConfigurator ===
          "separators"
            ? "#eef4fb"
            : "#ffffff",
        color:
          activeConfigurator ===
          "separators"
            ? "#2767c5"
            : "#303840"
      }}
    >
      Configurador separadors
    </button>

    <button
      type="button"
      onClick={() => {
        setActiveConfigurator(
          "pallet"
        );

        openPalletDialog();
      }}
      style={{
        ...configuratorButtonStyle,
        borderColor:
          activeConfigurator ===
          "pallet"
            ? "#2767c5"
            : "#aeb6bf",
        background:
          activeConfigurator ===
          "pallet"
            ? "#eef4fb"
            : "#ffffff",
        color:
          activeConfigurator ===
          "pallet"
            ? "#2767c5"
            : "#303840"
      }}
    >
      Configurador palet
    </button>

    <button
      type="button"
      onClick={() => {
        selectConfigurator(
          "layers"
        );
      }}
      style={{
        ...configuratorButtonStyle,
        borderColor:
          activeConfigurator ===
          "layers"
            ? "#2767c5"
            : "#aeb6bf",
        background:
          activeConfigurator ===
          "layers"
            ? "#eef4fb"
            : "#ffffff",
        color:
          activeConfigurator ===
          "layers"
            ? "#2767c5"
            : "#303840"
      }}
    >
      Configurador capes
    </button>

    <button
      type="button"
      onClick={() => {
        selectConfigurator(
          "palletizing"
        );
      }}
      style={{
        ...configuratorButtonStyle,
        borderColor:
          activeConfigurator ===
          "palletizing"
            ? "#2767c5"
            : "#aeb6bf",
        background:
          activeConfigurator ===
          "palletizing"
            ? "#eef4fb"
            : "#ffffff",
        color:
          activeConfigurator ===
          "palletizing"
            ? "#2767c5"
            : "#303840"
      }}
    >
      Configurador paletitzat
    </button>
  </div>
</section>

{activeConfigurator ===
  "layers" && (
  <section
    style={{
      ...panelSectionStyle,
      marginBottom: "12px"
    }}
  >
    <h4
      style={{
        margin: "0 0 9px 0",
        color: "#4f5870",
        fontSize: "14px",
        textAlign: "center"
      }}
    >
      CONFIGURADOR CAPES
    </h4>

    <div
      style={{
        display: "flex",
        gap: "6px"
      }}
    >
      <button
        type="button"
        onClick={
          openNewPieceDialog
        }
        style={{
          ...panelButtonStyle,
          borderColor: "#2767c5",
          background: "#2767c5",
          color: "#ffffff"
        }}
      >
        Nova peça
      </button>

      <button
        type="button"
        onClick={
          duplicatePiece
        }
        disabled={
          !selectedData
        }
        style={{
          ...panelButtonStyle,
          background:
            selectedData
              ? "#ffffff"
              : "#eceff2",
          color:
            selectedData
              ? "#303840"
              : "#7b848d",
          opacity:
            selectedData
              ? 1
              : 0.65,
          cursor:
            selectedData
              ? "pointer"
              : "not-allowed"
        }}
      >
        Duplicar
      </button>

      <button
        type="button"
        onClick={
          deletePiece
        }
        disabled={
          !selectedData
        }
        style={{
          ...panelButtonStyle,
          borderColor:
            selectedData
              ? "#b02a37"
              : "#c5cbd1",
          background:
            selectedData
              ? "#ffffff"
              : "#eceff2",
          color:
            selectedData
              ? "#b02a37"
              : "#7b848d",
          opacity:
            selectedData
              ? 1
              : 0.65,
          cursor:
            selectedData
              ? "pointer"
              : "not-allowed"
        }}
      >
        Eliminar
      </button>
    </div>
  </section>
)}










{activeConfigurator ===
  "layers" &&
  selectedData && (
<>

<h3
  style={{
    margin: "2px 0 12px 0",
    textAlign: "center",
    color: "#4f5870",
    fontSize: "17px",
    fontWeight: 700,
    letterSpacing: "0.4px"
  }}
>
  PEÇA SELECCIONADA
</h3>


<section
  style={{
    ...panelSectionStyle,
    marginBottom: "10px",
    textAlign: "center"
  }}
>
  <div
    style={{
      fontSize: "13px",
      marginBottom: "4px"
    }}
  >
    <strong>ID:</strong>{" "}
    {selectedData.id}
  </div>

  <div
    style={{
      fontSize: "13px",
      marginBottom: "4px"
    }}
  >
    <strong>Nom:</strong>{" "}
    {selectedData.name ??
      `Peça ${selectedData.id}`}
  </div>

</section>




<section
  style={{
    ...panelSectionStyle,
    marginBottom: "10px"
  }}
>
  <h4
    style={{
      margin: "0 0 9px 0",
      color: "#4f5870",
      fontSize: "14px",
      textAlign: "center"
    }}
  >
    Referència TCP Robot 
  </h4>


  <label
    style={{
      ...panelRowStyle,
      marginBottom: 0
    }}
  >
    Cara contacte

    <select
      value={
        selectedData.referencePoint
      }
      onChange={(event) => {
        const newReferencePoint =
          event.target.value;

        setPieces(
          (currentPieces) =>
            currentPieces.map(
              (piece) =>
                piece.id ===
                selectedPieceId
                  ? {
                      ...piece,
                      referencePoint:
                        newReferencePoint
                    }
                  : piece
            )
        );
      }}
      style={panelSelectStyle}
    >
      {REFERENCE_POINT_OPTIONS.map(
        (option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        )
      )}
    </select>
  </label>

  <label style={panelRowStyle}>
  <span>
    Face Offset X
  </span>

  <input
    type="number"
    value={
      selectedData.faceOffsetX
    }
    onChange={(event) => {
      updatePieceField(
        "faceOffsetX",
        event.target.value
      );
    }}
    style={panelInputStyle}
  />
</label>

  <label style={panelRowStyle}>
  <span>
    Face Offset Y
  </span>

  <input
    type="number"
    value={
      selectedData.faceOffsetY
    }
    onChange={(event) => {
      updatePieceField(
        "faceOffsetY",
        event.target.value
      );
    }}
    style={panelInputStyle}
  />
</label>

  <label style={panelRowStyle}>
  <span>
    Face Rotation
  </span>

  <input
    type="number"
    value={
      selectedData.faceRotationDeg
    }
    onChange={(event) => {
      updatePieceField(
        "faceRotationDeg",
        event.target.value
      );
    }}
    style={panelInputStyle}
  />
</label>
</section>



<section
  style={{
    ...panelSectionStyle,
    marginBottom: "10px"
  }}
>
  <h4
    style={{
      margin: "0 0 9px 0",
      color: "#4f5870",
      fontSize: "14px",
      textAlign: "center"
    }}
  >
    Posició Peça
  </h4>

  <label style={panelRowStyle}>
  <span>X</span>

  <input
    type="number"
    value={inputX}
    onChange={(event) => {
      setInputX(
        event.target.value
      );

      updateDisplayedCoordinates(
        "x",
        event.target.value
      );
    }}
    style={panelInputStyle}
  />
</label>

  <label style={panelRowStyle}>
    Y

    <input
      type="number"
      value={inputY}
      onChange={(event) => {
        setInputY(
          event.target.value
        );

        updateDisplayedCoordinates(
          "y",
          event.target.value
        );
      }}
      style={panelInputStyle}
    />
  </label>

  <label style={panelRowStyle}>
    Z

    <input
      type="number"
      value={inputZ}
      onChange={(event) => {
        setInputZ(
          event.target.value
        );

        updateDisplayedCoordinates(
          "z",
          event.target.value
        );
      }}
      style={panelInputStyle}
    />
  </label>

  <label style={panelRowStyle}>
    RX

    <input
      type="number"
      value={inputRX}
      onChange={(event) => {
        setInputRX(
          event.target.value
        );

        updatePieceField(
          "rxDeg",
          event.target.value
        );
      }}
      style={panelInputStyle}
    />
  </label>

  <label style={panelRowStyle}>
    RY

    <input
      type="number"
      value={inputRY}
      onChange={(event) => {
        setInputRY(
          event.target.value
        );

        updatePieceField(
          "ryDeg",
          event.target.value
        );
      }}
      style={panelInputStyle}
    />
  </label>

  <label
    style={{
      ...panelRowStyle,
      marginBottom: 0
    }}
  >
    RZ

    <input
      type="number"
      value={inputRZ}
      onChange={(event) => {
        setInputRZ(
          event.target.value
        );

        updatePieceField(
          "rzDeg",
          event.target.value
        );
      }}
      style={panelInputStyle}
    />
  </label>
</section>












<section
  style={panelSectionStyle}
>
  <h4
    style={{
      margin: "0 0 9px 0",
      color: "#4f5870",
      fontSize: "14px",
      textAlign: "center"
    }}
  >
    Orientació referència
  </h4>

  <label style={panelRowStyle}>
    Ref RX

    <input
      value={
        referenceEuler.rx.toFixed(2)
      }
      readOnly
      style={readOnlyInputStyle}
    />
  </label>

  <label style={panelRowStyle}>
    Ref RY

    <input
      value={
        referenceEuler.ry.toFixed(2)
      }
      readOnly
      style={readOnlyInputStyle}
    />
  </label>

  <label
    style={{
      ...panelRowStyle,
      marginBottom: 0
    }}
  >
    Ref RZ

    <input
      value={
        referenceEuler.rz.toFixed(2)
      }
      readOnly
      style={readOnlyInputStyle}
    />
  </label>
</section>

</>
)}
















</div>

<NewPieceDialog
  open={
    isNewPieceDialogOpen
  }
  onClose={() => {
    setIsNewPieceDialogOpen(
      false
    );
  }}
  onCreatePiece={
    createPieceFromDialog
  }
/>

<PalletDialog
  open={isPalletDialogOpen}
  activePallet={activePallet}
  onClose={() => {
    setIsPalletDialogOpen(
      false
    );
  }}
  onApplyPallet={applyPallet}
/>

<OpenProjectDialog
  open={
    isOpenProjectDialogOpen
  }
  onClose={() => {
    setIsOpenProjectDialogOpen(
      false
    );
  }}
  onOpenProject={
    applyOpenedProject
  }
/>

<div
  style={{
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  }}
>
  {isLanguageMessageVisible && (
    <div
      style={{
        padding: "8px 11px",
        border: "1px solid #b9d2f5",
        borderRadius: "6px",
        background: "#ffffff",
        color: "#2767c5",
        fontSize: "13px",
        fontWeight: 700,
        boxShadow:
          "0 4px 14px rgba(0, 0, 0, 0.14)"
      }}
    >
      https://www.amazon.es/diccionario-catalan-castellano/s?k=diccionario+catalan+castellano
    </div>
  )}

  <button
    type="button"
    aria-label="Canviar idioma"
    title="Canviar idioma"
    onClick={() => {
      setIsLanguageMessageVisible(
        (currentValue) =>
          !currentValue
      );
    }}
    style={{
      width: "46px",
      height: "46px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      border: "1px solid #2767c5",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#2767c5",
      fontSize: "24px",
      lineHeight: 1,
      cursor: "pointer",
      boxShadow:
        "0 5px 16px rgba(0, 0, 0, 0.18)"
    }}
  >
    🌐
  </button>
</div>



<SaveProjectDialog
  open={
    isSaveProjectDialogOpen
  }
  initialName={
    saveProjectSuggestedName
  }
  onCancel={() => {
    setIsSaveProjectDialogOpen(
      false
    );
  }}
  onSave={
    confirmSaveCurrentProjectAs
  }
/>

<ConfirmDialog
  open={
    confirmDialog.open
  }
  title={
    confirmDialog.title
  }
  message={
    confirmDialog.message
  }
  confirmLabel={
    confirmDialog.confirmLabel
  }
  destructive={
    confirmDialog.destructive
  }
  onConfirm={
    confirmDialogAction
  }
  onCancel={
    closeConfirmDialog
  }
/>
</>
 );

}

