//Motor 3D
import   { Canvas }   from   "@react-three/fiber";
//controls de camera
import { OrbitControls } from "@react-three/drei";
import { useState, useEffect } from "react";

export default function App() {
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [inputX, setInputX] = useState("");
  const [inputY, setInputY] = useState("");
  const [inputZ, setInputZ] = useState("");
  const [inputRX, setInputRX] = useState("");
  const [inputRY, setInputRY] = useState("");
  const [inputRZ, setInputRZ] = useState("");

  //arrai de peçes espai
  const [pieces, setPieces] = useState([
    { id: 1, x: -100, y: 150,z:-30, rxDeg: 0, ryDeg: 0, rzDeg: 0},
    { id: 2, x: 200, y: 150, z: 100, rxDeg: 0, ryDeg: 0, rzDeg: 0 },
    { id: 3, x: 500, y: 150, z: 200, rxDeg: 0, ryDeg: 0, rzDeg: 0 }
]);
  const selectedData = pieces.find(
 piece => piece.id === selectedPieceId

);
useEffect(() => {
if (selectedData) {
setInputX(String(selectedData.z));
setInputY(String(selectedData.x));
setInputZ(String(selectedData.y));
setInputRX(String(selectedData.rxDeg));
setInputRY(String(selectedData.ryDeg));
setInputRZ(String(selectedData.rzDeg));
}
}, 

[selectedPieceId]);

function updatePieceField(field, value) {
const numericValue = parseFloat(value);
if (value === "") return;
if (isNaN(numericValue)) return;
setPieces(
pieces.map(piece =>
piece.id === selectedPieceId
? { ...piece, [field]: numericValue }
: piece
)
);
}

function degreesToRadians(degrees) {
return degrees * Math.PI / 180;
}
//escena 3D
 return (
  <>
  <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [2000, 1500, 2000], near: 1, far: 20000 }}>
    //Color de fons
    <color attach="background" args={["white"]} />
    <ambientLight intensity={2} />

    //posicio i mides del palet
    <mesh position={[-600, 50, -400]}>
    
    <boxGeometry args={[1200, 100, 800]} />
    <meshStandardMaterial color="brown" />

</mesh>
//generar una peça 3D per cada registre de l'array
    {pieces.map((piece) => (
  <mesh key={piece.id} position={[piece.x,piece.y,piece.z]} rotation={[degreesToRadians(piece.rxDeg),degreesToRadians(piece.ryDeg),degreesToRadians(piece.rzDeg)]} onClick={() => setSelectedPieceId(piece.id)}>
   <boxGeometry args={[200, 100, 60]} />
   <meshStandardMaterial color={piece.id === selectedPieceId ? "red" : "orange"} />
  </mesh>
))}
// Graella al terra

    <gridHelper args={[5000, 50]} />
    <OrbitControls />
  </Canvas>
  <div style={{
 position: "absolute",
 top: 20,
 left: 20,
 background: "white",
 padding: "20px",
 border: "5px solid black"
 
}}>
<h3>PEÇA SELECCIONADA</h3>

{selectedData && (
<>
<div>ID: {selectedData.id}</div>

<div>X:
<input
value={inputZ}
onChange={(e) => {
setInputZ(e.target.value);
updatePieceField("z", -e.target.value);
}}
/>
</div>

<div>Y:
<input
value={inputX}
onChange={(e) => {
setInputX(e.target.value);
updatePieceField("x", -e.target.value);
}}
/>
</div>


<div>Z:
<input
value={inputY}
onChange={(e) => {
setInputY(e.target.value);
updatePieceField("y", e.target.value);
}}
/>
</div>


<div>RX:
<input
value={inputRX}
onChange={(e) => {
setInputRX(e.target.value);
updatePieceField("rxDeg", e.target.value);
}}
/>
</div>


<div>RY:
<input
value={inputRY}
onChange={(e) => {
setInputRY(e.target.value);
updatePieceField("ryDeg", e.target.value);
}}
/>
</div>


<div>RZ:
<input
value={inputRZ}
onChange={(e) => {
setInputRZ(e.target.value);
updatePieceField("rzDeg", e.target.value);
}}
/>
</div>


</>
)}

</div>
</>
 );
}