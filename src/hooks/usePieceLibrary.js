import { useEffect, useState } from "react";
import {
  loadPieceLibrary,
  PIECE_LIBRARY_CHANGED_EVENT
} from "../utils/pieceLibrary.js";

/*
  Peces guardades a la biblioteca, sempre al dia: es
  tornen a llegir quan el Configurador de peces les
  modifica.
*/
export default function usePieceLibrary() {
  const [library, setLibrary] = useState(loadPieceLibrary);

  useEffect(() => {
    function handleChange() {
      setLibrary(loadPieceLibrary());
    }

    window.addEventListener(PIECE_LIBRARY_CHANGED_EVENT, handleChange);
    // Canvis fets des d'una altra pestanya
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(PIECE_LIBRARY_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return library;
}
