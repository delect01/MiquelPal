import {
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const appPath = resolve(root, "src/App.jsx");
const buttonPath = resolve(root, "src/components/LanguageJokeButton.jsx");
const hookPath = resolve(root, "src/hooks/useTranslator.js");
const translatorPath = resolve(root, "src/i18n/traductor.js");

for (const path of [appPath, buttonPath, hookPath, translatorPath]) {
  await copyFile(path, `${path}.language-selector-v2-backup`);
}

const translatorSource = await readFile(translatorPath, "utf8");
let appSource = await readFile(appPath, "utf8");

const knownLanguages = [
  ["ca", "Català"],
  ["es", "Español"],
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["nl", "Nederlands"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["eu", "Euskara"],
  ["gl", "Galego"],
  ["ar", "العربية"],
  ["he", "עברית"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["ko", "한국어"]
];

function languageAppears(code) {
  const patterns = [
    new RegExp(`case\\s+["']${code}["']`),
    new RegExp(`["']${code}["']\\s*:`),
    new RegExp(`\\b${code}\\s*:`),
    new RegExp(`["']${code}["']\\s*,`)
  ];
  return patterns.some((pattern) => pattern.test(translatorSource));
}

let languages = knownLanguages
  .filter(([code]) => languageAppears(code))
  .map(([code, label]) => ({ code, label }));

if (!languages.some((item) => item.code === "ca")) {
  languages.unshift({ code: "ca", label: "Català" });
}

if (languages.length === 1) {
  for (const [code, label] of knownLanguages.slice(1, 3)) {
    if (translatorSource.includes(code)) {
      languages.push({ code, label });
    }
  }
}

const hookSource = `import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getLanguageDirection,
  getTranslator
} from "../i18n/traductor.js";

const LANGUAGE_STORAGE_KEY =
  "pallet-simulator-language";

const AVAILABLE_LANGUAGES =
  ${JSON.stringify(languages, null, 2)};

function getInitialLanguage(
  fallbackLanguage
) {
  try {
    const savedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      AVAILABLE_LANGUAGES.some(
        (language) =>
          language.code ===
          savedLanguage
      )
    ) {
      return savedLanguage;
    }
  } catch {
    // Utilitzem l'idioma inicial.
  }

  return fallbackLanguage;
}

export default function useTranslator(
  initialLanguage = "ca"
) {
  const [
    activeLanguage,
    setActiveLanguage
  ] = useState(() =>
    getInitialLanguage(
      initialLanguage
    )
  );

  const t = useMemo(
    () =>
      getTranslator(
        activeLanguage
      ),
    [activeLanguage]
  );

  const languageDirection =
    useMemo(
      () =>
        getLanguageDirection(
          activeLanguage
        ),
      [activeLanguage]
    );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        activeLanguage
      );
    } catch {
      // L'aplicacio continua encara que no hi hagi localStorage.
    }

    document.documentElement.lang =
      activeLanguage;

    document.documentElement.dir =
      languageDirection;
  }, [
    activeLanguage,
    languageDirection
  ]);

  return {
    activeLanguage,
    setActiveLanguage,
    languageDirection,
    availableLanguages:
      AVAILABLE_LANGUAGES,
    t
  };
}
`;

const buttonSource = `import {
  useEffect,
  useRef,
  useState
} from "react";

const SINGLE_CLICK_DELAY_MS = 230;

export default function LanguageJokeButton({
  visible,
  onToggle,
  t,
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

    clickTimerRef.current =
      window.setTimeout(() => {
        clickTimerRef.current = null;
        setMenuOpen(
          (currentValue) =>
            !currentValue
        );
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

  const message =
    t?.language?.message ??
    t?.languageMessage ??
    "La llengua canvia, però el palet continua ben col·locat.";

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
          {message}
        </div>
      )}
    </div>
  );
}
`;

await writeFile(hookPath, hookSource, "utf8");
await writeFile(buttonPath, buttonSource, "utf8");

if (!appSource.includes("activeLanguage,") || !appSource.includes("availableLanguages,")) {
  appSource = appSource.replace(
    /const\s*\{\s*t\s*\}\s*=\s*useTranslator\(["']ca["']\)\s*;/,
`const {
  t,
  activeLanguage,
  setActiveLanguage,
  availableLanguages
} = useTranslator("ca");`
  );
}

const languageComponentStart = appSource.indexOf("<LanguageJokeButton");
if (languageComponentStart === -1) {
  throw new Error("[NO TROBAT] LanguageJokeButton a App.jsx");
}
const languageComponentEnd = appSource.indexOf("/>", languageComponentStart);
if (languageComponentEnd === -1) {
  throw new Error("[NO TROBAT] tancament de LanguageJokeButton");
}
const oldLanguageComponent = appSource.slice(languageComponentStart, languageComponentEnd + 2);
const newLanguageComponent = `<LanguageJokeButton
  visible={
    isLanguageMessageVisible
  }
  onToggle={() => {
    setIsLanguageMessageVisible(
      (currentValue) =>
        !currentValue
    );
  }}
  activeLanguage={
    activeLanguage
  }
  availableLanguages={
    availableLanguages
  }
  onChangeLanguage={
    setActiveLanguage
  }
  t={
    t
  }
/>`;
appSource = appSource.replace(oldLanguageComponent, newLanguageComponent);

await writeFile(appPath, appSource, "utf8");

const checks = {
  languagesDetected: languages.length,
  appConnected: appSource.includes("onChangeLanguage={"),
  singleClick: buttonSource.includes("SINGLE_CLICK_DELAY_MS"),
  doubleClick: buttonSource.includes("onDoubleClick="),
  persistence: hookSource.includes("pallet-simulator-language")
};
console.log("VERIFICACIO:", checks);
if (!checks.appConnected || !checks.singleClick || !checks.doubleClick || !checks.persistence) {
  throw new Error("La verificacio final ha fallat.");
}
console.log("[OK] Selector d'idiomes instal·lat.");
console.log("Idiomes detectats:", languages.map((item) => item.code).join(", "));
