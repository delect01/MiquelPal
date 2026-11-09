/*
  Botó quadrat ▶ per iniciar una simulació de
  moviment. En verd mentre la simulació és activa.
*/
export default function SimulateButton({
  running,
  disabled,
  title,
  onClick,
  size = 24
}) {
  const iconSize = Math.round(size * 0.42);

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        width: `${size}px`,
        height: `${size}px`,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: running ? "1px solid #168447" : "1px solid #aeb6bf",
        borderRadius: size > 28 ? "5px" : "4px",
        background: disabled
          ? "#eceff2"
          : running
            ? "#168447"
            : "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path
          d="M2 1 L9 5 L2 9 Z"
          fill={disabled ? "#9aa3ad" : running ? "#ffffff" : "#168447"}
        />
      </svg>
    </button>
  );
}
