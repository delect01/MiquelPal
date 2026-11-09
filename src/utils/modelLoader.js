import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { getImportedModel } from "./modelStorage.js";
import { buildImportedCollisionGeometry } from "./importedGeometry.js";

const UNIT_SCALE = { mm: 1, cm: 10, m: 1000 };
const sourceCache = new Map();

export const MODEL_BOTTOM_FACES = [
  { value: "NEGATIVE_Y", label: "Cara inferior actual (-Y)" },
  { value: "POSITIVE_Y", label: "Cara superior actual (+Y)" },
  { value: "NEGATIVE_X", label: "Cara esquerra actual (-X)" },
  { value: "POSITIVE_X", label: "Cara dreta actual (+X)" },
  { value: "NEGATIVE_Z", label: "Cara posterior actual (-Z)" },
  { value: "POSITIVE_Z", label: "Cara frontal actual (+Z)" }
];

const SOURCE_FACE_DIRECTIONS = {
  NEGATIVE_X: new THREE.Vector3(-1, 0, 0),
  POSITIVE_X: new THREE.Vector3(1, 0, 0),
  NEGATIVE_Y: new THREE.Vector3(0, -1, 0),
  POSITIVE_Y: new THREE.Vector3(0, 1, 0),
  NEGATIVE_Z: new THREE.Vector3(0, 0, -1),
  POSITIVE_Z: new THREE.Vector3(0, 0, 1)
};

const WORLD_DOWN = new THREE.Vector3(0, -1, 0);

function getFormat(name) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "glb" || extension === "stl") return extension;
  throw new Error("Format no compatible. Utilitza .glb o .stl.");
}

function parseGlb(buffer) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
  });
}

function parseStl(buffer) {
  const geometry = new STLLoader().parse(buffer);
  geometry.computeVertexNormals();
  // Mateix acabat que les peces creades; es pinta amb el color de la peça
  const material = new THREE.MeshStandardMaterial({
    color: "orange",
    roughness: 0.65,
    metalness: 0
  });
  material.userData.usesPieceColor = true;

  return new THREE.Mesh(geometry, material);
}

function cloneMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
  });
}

function getSelectedSupportFace(collisionGeometry, bottomFace) {
  const requestedDirection =
    SOURCE_FACE_DIRECTIONS[bottomFace] ?? SOURCE_FACE_DIRECTIONS.NEGATIVE_Y;

  let bestFace = null;
  let bestDot = -Infinity;

  collisionGeometry.faces.forEach((face) => {
    const normal = new THREE.Vector3(
      Number(face.normal?.x ?? 0),
      Number(face.normal?.y ?? 0),
      Number(face.normal?.z ?? 0)
    );

    if (normal.lengthSq() < Number.EPSILON) return;
    normal.normalize();

    const dot = normal.dot(requestedDirection);
    if (dot > bestDot) {
      bestDot = dot;
      bestFace = { ...face, normal };
    }
  });

  return bestFace;
}

function orientSelectedFaceToFloor(object, bottomFace) {
  object.updateMatrixWorld(true);

  const provisionalCollisionGeometry =
    buildImportedCollisionGeometry(object);

  const selectedFace = getSelectedSupportFace(
    provisionalCollisionGeometry,
    bottomFace
  );

  if (!selectedFace) {
    throw new Error("No s'ha pogut identificar la cara inferior del model.");
  }

  const alignmentQuaternion = new THREE.Quaternion()
    .setFromUnitVectors(selectedFace.normal, WORLD_DOWN)
    .normalize();

  object.quaternion.premultiply(alignmentQuaternion);
  object.updateMatrixWorld(true);
}

function getCollisionGeometryBounds(collisionGeometry) {
  const points = collisionGeometry.vertices.map(
    (vertex) => new THREE.Vector3(
      Number(vertex.x),
      Number(vertex.y),
      Number(vertex.z)
    )
  );

  const box = new THREE.Box3().setFromPoints(points);

  return {
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3())
  };
}

function centerOrientedObject(object) {
  /*
    La mida i el centre provenen exclusivament de la mateixa
    geometria visible que utilitzen el SAT i l'iman.
    No fem servir Box3.setFromObject(), perquè podria incloure
    meshes auxiliars o límits rectangulars ocults del GLB.
  */
  object.updateMatrixWorld(true);

  const orientedCollisionGeometry =
    buildImportedCollisionGeometry(object);

  const { center, size } =
    getCollisionGeometryBounds(orientedCollisionGeometry);

  object.position.sub(center);
  object.updateMatrixWorld(true);

  return {
    width: size.x,
    height: size.y,
    depth: size.z
  };
}

function prepareObject(source, unit, bottomFace) {
  const root = new THREE.Group();
  const object = source.clone(true);

  cloneMaterials(object);
  object.scale.multiplyScalar(UNIT_SCALE[unit] ?? 1);
  object.updateMatrixWorld(true);

  orientSelectedFaceToFloor(object, bottomFace);
  const dimensions = centerOrientedObject(object);

  root.add(object);
  root.updateMatrixWorld(true);

  const collisionGeometry = buildImportedCollisionGeometry(root);

  return { object: root, dimensions, collisionGeometry };
}

async function parseBlob(blob, format) {
  const buffer = await blob.arrayBuffer();
  return format === "glb" ? parseGlb(buffer) : parseStl(buffer);
}

export async function inspectModelFile(
  file,
  unit = "mm",
  bottomFace = "NEGATIVE_Y"
) {
  const format = getFormat(file.name);
  const source = await parseBlob(file, format);
  return { format, ...prepareObject(source, unit, bottomFace) };
}

async function getSource(modelId) {
  if (sourceCache.has(modelId)) return sourceCache.get(modelId);

  const record = await getImportedModel(modelId);
  if (!record) throw new Error("No s'ha trobat el model 3D desat.");

  const source = await parseBlob(record.blob, record.format);
  const value = { source, record };
  sourceCache.set(modelId, value);
  return value;
}

/*
  Model preparat (orientat, centrat i amb el volum de
  col·lisió) per model i cara inferior. Es calcula una
  sola vegada: abans cada peça del mateix model ho
  repetia, i obrir un projecte amb moltes peces
  importades bloquejava la interfície.
*/
const preparedCache = new Map();

export async function loadStoredModel(
  modelId,
  bottomFace = "NEGATIVE_Y"
) {
  const key = `${modelId}|${bottomFace}`;

  if (!preparedCache.has(key)) {
    const preparing = getSource(modelId).then(({ source, record }) =>
      prepareObject(source, record.unit, bottomFace)
    );

    // Si falla, es podrà tornar a provar
    preparing.catch(() => preparedCache.delete(key));
    preparedCache.set(key, preparing);
  }

  const prepared = await preparedCache.get(key);

  // Cada ús rep el seu objecte i materials (es pinten per estat)
  const object = prepared.object.clone(true);
  cloneMaterials(object);

  return {
    object,
    dimensions: { ...prepared.dimensions },
    collisionGeometry: prepared.collisionGeometry
  };
}

export function clearModelMemoryCache(modelId = null) {
  if (modelId) {
    sourceCache.delete(modelId);
    [...preparedCache.keys()]
      .filter((key) => key.startsWith(`${modelId}|`))
      .forEach((key) => preparedCache.delete(key));
  } else {
    sourceCache.clear();
    preparedCache.clear();
  }
}

function getTopSurfaceFootprint(object) {
  object.updateMatrixWorld(true);

  const vertices = [];
  const point = new THREE.Vector3();
  let maximumY = -Infinity;
  let minimumY = Infinity;

  object.traverse((child) => {
    const position =
      child.geometry?.attributes?.position;

    if (!position) {
      return;
    }

    for (
      let index = 0;
      index < position.count;
      index += 1
    ) {
      point
        .fromBufferAttribute(
          position,
          index
        )
        .applyMatrix4(
          child.matrixWorld
        );

      vertices.push(
        point.clone()
      );

      maximumY = Math.max(
        maximumY,
        point.y
      );

      minimumY = Math.min(
        minimumY,
        point.y
      );
    }
  });

  if (!vertices.length) {
    const bounds =
      new THREE.Box3()
        .setFromObject(object);

    return {
      minimumX: bounds.min.x,
      maximumX: bounds.max.x,
      minimumZ: bounds.min.z,
      maximumZ: bounds.max.z,
      maximumY: bounds.max.y
    };
  }

  const height = Math.max(
    maximumY - minimumY,
    1
  );

  const tolerance = Math.max(
    0.25,
    height * 0.0005
  );

  const topVertices =
    vertices.filter(
      (vertex) =>
        maximumY - vertex.y <=
        tolerance
    );

  const footprintVertices =
    topVertices.length >= 3
      ? topVertices
      : vertices;

  return {
    minimumX: Math.min(
      ...footprintVertices.map(
        (vertex) => vertex.x
      )
    ),
    maximumX: Math.max(
      ...footprintVertices.map(
        (vertex) => vertex.x
      )
    ),
    minimumZ: Math.min(
      ...footprintVertices.map(
        (vertex) => vertex.z
      )
    ),
    maximumZ: Math.max(
      ...footprintVertices.map(
        (vertex) => vertex.z
      )
    ),
    maximumY
  };
}

export async function loadTransformedStoredModel(
  modelId,
  options = {}
) {
  const loaded =
    await loadStoredModel(
      modelId,
      options.modelBottomFace ??
        "NEGATIVE_Y"
    );

  const object =
    loaded.object.clone(true);

  object.rotation.set(
    THREE.MathUtils.degToRad(
      Number(options.rotationX) || 0
    ),
    THREE.MathUtils.degToRad(
      Number(options.rotationY) || 0
    ),
    THREE.MathUtils.degToRad(
      Number(options.rotationZ) || 0
    ),
    "XYZ"
  );

  object.updateMatrixWorld(true);

  const top =
    getTopSurfaceFootprint(object);

  /*
    Conversio de coordenades del projecte:

    +X pallet -> -Z Three
    +Y pallet -> -X Three
    +Z pallet -> +Y Three

    Per tant, l'origen del palet es la
    cantonada superior amb X i Z maxims
    en Three.js. La superficie util creix
    des d'aquesta cantonada cap a -X i -Z.
  */
  object.position.x -=
    top.maximumX;

  object.position.z -=
    top.maximumZ;

  object.position.y -=
    top.maximumY;

  object.updateMatrixWorld(true);

  const fullBounds =
    new THREE.Box3()
      .setFromObject(object);

  const topWidthThree =
    top.maximumX -
    top.minimumX;

  const topDepthThree =
    top.maximumZ -
    top.minimumZ;

  return {
    object,
    fullBounds,

    topFootprint: {
      minimumX:
        -topWidthThree,
      maximumX: 0,
      minimumZ:
        -topDepthThree,
      maximumZ: 0,
      y: 0
    },

    palletDimensions: {
      sizeX:
        topDepthThree,
      sizeY:
        topWidthThree,
      sizeZ:
        Math.abs(
          fullBounds.min.y
        )
    }
  };
}
