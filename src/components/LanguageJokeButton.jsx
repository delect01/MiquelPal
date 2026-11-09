import {
  useEffect,
  useRef,
  useState
} from "react";

const SINGLE_CLICK_DELAY_MS = 230;

const DICTIONARY_URL =
  "https://www.amazon.es/diccionario-catalan-castellano/s?k=diccionario+catalan+castellano";

/*
  Botó d'idioma:
  - un clic: obre o tanca el desplegable d'idiomes i
    amaga el link (si es veia);
  - doble clic: mostra o amaga el link.
*/
export default function LanguageJokeButton({
  visible,
  onToggle,
  onHide,
  activeLanguage,
  availableLanguages = [],
  onChangeLanguage
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const clickTimerRef =
    useRef(null);

  const rootRef = useRef(null);

  useEffect(() => {
    function handleOutsidePointerDown(
      event
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target
        )
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "pointerdown",
      handleOutsidePointerDown
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown
      );

      if (clickTimerRef.current) {
        window.clearTimeout(
          clickTimerRef.current
        );
      }
    };
  }, []);

  function handleSingleClick() {
    if (clickTimerRef.current) {
      return;
    }

    /*
      Només quan ja és segur que no és un doble clic: si
      s'amagués el link de seguida, el doble clic el
      tornaria a mostrar.
    */
    clickTimerRef.current =
      window.setTimeout(() => {
        clickTimerRef.current = null;
        setMenuOpen(
          (currentValue) =>
            !currentValue
        );
        onHide?.();
      }, SINGLE_CLICK_DELAY_MS);
  }

  function handleDoubleClick(event) {
    event.preventDefault();

    if (clickTimerRef.current) {
      window.clearTimeout(
        clickTimerRef.current
      );
      clickTimerRef.current = null;
    }

    setMenuOpen(false);
    onToggle?.();
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 1400,
        fontFamily:
          "Arial, Helvetica, sans-serif"
      }}
    >
      <button
        type="button"
        onClick={handleSingleClick}
        onDoubleClick={
          handleDoubleClick
        }
        aria-label="Seleccionar idioma"
        title="Un clic: idiomes · Doble clic: missatge"
        style={{
          width: "48px",
          height: "48px",
          border:
            "1px solid #9aa5af",
          borderRadius: "10px",
          background: "#ffffff",
          color: "#244d7c",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow:
            "0 6px 18px rgba(0,0,0,0.16)"
        }}
      >
        🌐
      </button>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "56px",
            right: 0,
            width: "190px",
            padding: "7px",
            border:
              "1px solid #c6ccd2",
            borderRadius: "8px",
            background: "#ffffff",
            boxShadow:
              "0 10px 26px rgba(0,0,0,0.2)"
          }}
        >
          {availableLanguages.map(
            (language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => {
                  onChangeLanguage?.(
                    language.code
                  );
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: "5px",
                  background:
                    activeLanguage ===
                    language.code
                      ? "#eef4fb"
                      : "transparent",
                  color:
                    activeLanguage ===
                    language.code
                      ? "#2767c5"
                      : "#303840",
                  fontSize: "13px",
                  fontWeight:
                    activeLanguage ===
                    language.code
                      ? 700
                      : 500,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                {language.label}
              </button>
            )
          )}
        </div>
      )}

      {visible && (
        <div
          style={{
            position: "absolute",
            top: "56px",
            right:
              menuOpen
                ? "200px"
                : 0,
            width: "260px",
            padding: "10px 12px",
            border:
              "1px solid #c6ccd2",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#303840",
            fontSize: "13px",
            lineHeight: 1.45,
            boxShadow:
              "0 10px 26px rgba(0,0,0,0.2)"
          }}
        >
          <a
            href={DICTIONARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1a5fd0",
              textDecoration: "underline",
              wordBreak: "break-all"
            }}
          >
            {DICTIONARY_URL}
          </a>
        </div>
      )}
    </div>
  );
}
