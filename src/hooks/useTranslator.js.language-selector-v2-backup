import {
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
  [
  {
    "code": "ca",
    "label": "Català"
  },
  {
    "code": "es",
    "label": "Español"
  },
  {
    "code": "en",
    "label": "English"
  },
  {
    "code": "fr",
    "label": "Français"
  },
  {
    "code": "ar",
    "label": "العربية"
  }
];

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
