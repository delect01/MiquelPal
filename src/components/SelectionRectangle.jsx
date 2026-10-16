export default function SelectionRectangle({ rectangle }) {
  if (!rectangle) {
    return null;
  }

  const left = Math.min(
    rectangle.startX,
    rectangle.currentX
  );

  const top = Math.min(
    rectangle.startY,
    rectangle.currentY
  );

  const width = Math.abs(
    rectangle.currentX -
    rectangle.startX
  );

  const height = Math.abs(
    rectangle.currentY -
    rectangle.startY
  );

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width,
        height,
        zIndex: 900,
        boxSizing: "border-box",
        border: "1px solid #2767c5",
        background: "rgba(39, 103, 197, 0.16)",
        pointerEvents: "none"
      }}
    />
  );
}
