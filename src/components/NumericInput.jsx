import { useState } from "react";

const MAX_DECIMALS = 3;

/*
  Text que es pot estar escrivint: signe opcional,
  xifres i com a màxim MAX_DECIMALS decimals.
  Admet estats intermedis com "-", "-0" o "12.".
*/
const PARTIAL_NUMBER = new RegExp(
  `^-?\\d*(\\.\\d{0,${MAX_DECIMALS}})?$`
);

function formatValue(value) {
  return value === null || value === undefined
    ? ""
    : String(value);
}

function isCompleteNumber(text) {
  return (
    text !== "" &&
    text !== "-" &&
    Number.isFinite(Number(text))
  );
}

function matchesValue(text, value) {
  const formattedValue = formatValue(value);

  if (formattedValue === "" || !isCompleteNumber(text)) {
    return text === formattedValue;
  }

  return Number(text) === Number(value);
}

function roundToMaxDecimals(value) {
  const factor = 10 ** MAX_DECIMALS;
  return Math.round(value * factor) / factor;
}

/*
  Casella numèrica.

  Mentre s'escriu, mostra exactament el text teclejat
  (així es pot començar per "-" o escriure "-0.5"), i
  només avisa onChange quan el text ja és un número.
  En sortir de la casella torna a mostrar el valor real.

  onChange rep el número com a text, igual que
  event.target.value.
*/
export default function NumericInput({
  value,
  onChange,
  step = 1,
  onFocus,
  onBlur,
  onKeyDown,
  ...inputProps
}) {
  // null = no s'està editant
  const [draft, setDraft] = useState(null);
  const [previousValue, setPreviousValue] = useState(value);

  /*
    Si el valor canvia des de fora mentre s'edita
    (per exemple, la casella es buida després de
    prémer Enter) i ja no coincideix amb el text,
    mostrem el valor nou.
  */
  if (value !== previousValue) {
    setPreviousValue(value);

    if (draft !== null && !matchesValue(draft, value)) {
      setDraft(formatValue(value));
    }
  }

  const displayedText =
    draft === null ? formatValue(value) : draft;

  function commit(text) {
    setDraft(text);

    if (isCompleteNumber(text)) {
      onChange(text);
    }
  }

  function handleChange(event) {
    // Teclats amb coma decimal
    const text = event.target.value.replace(",", ".");

    // Caràcter no vàlid o massa decimals: s'ignora
    if (!PARTIAL_NUMBER.test(text)) {
      return;
    }

    commit(text);
  }

  // Fletxes amunt/avall, com a les caselles de número
  function handleKeyDown(event) {
    onKeyDown?.(event);

    if (
      event.defaultPrevented ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) {
      return;
    }

    event.preventDefault();

    const currentValue = Number(displayedText) || 0;
    const direction = event.key === "ArrowUp" ? 1 : -1;

    commit(
      String(
        roundToMaxDecimals(
          currentValue + direction * Number(step)
        )
      )
    );
  }

  return (
    <input
      {...inputProps}
      type="text"
      inputMode="decimal"
      value={displayedText}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        setDraft(formatValue(value));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
