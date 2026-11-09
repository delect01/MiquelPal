import DraggablePiece from "./DraggablePiece.jsx";

function noop() {}

/*
  Peça sense interacció per a les simulacions:
  mateixa aparença que a l'editor, però no es pot
  seleccionar ni arrossegar.
*/
export default function StaticPiece({ piece, selected = true }) {
  return (
    <DraggablePiece
      piece={piece}
      selected={selected}
      colliding={false}
      outside={false}
      onSelect={noop}
      onMove={noop}
      onDragStart={noop}
      onDragEnd={noop}
      onReplicationStart={noop}
      onReplicationMove={noop}
      onReplicationEnd={noop}
      onReplicationCancel={noop}
    />
  );
}
