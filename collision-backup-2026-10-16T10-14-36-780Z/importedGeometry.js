import * as THREE from "three";
import {
  ConvexGeometry
} from "three/examples/jsm/geometries/ConvexGeometry.js";

const VERTEX_EPSILON = 1e-5;
const PLANE_NORMAL_EPSILON = 1e-5;
const PLANE_DISTANCE_EPSILON = 1e-3;
const EDGE_DIRECTION_EPSILON = 1e-6;

function serializeVector(vector) {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
}

function vertexKey(vector) {
  return [
    vector.x,
    vector.y,
    vector.z
  ]
    .map((value) =>
      Math.round(
        value / VERTEX_EPSILON
      )
    )
    .join(":");
}

function edgeKey(indexA, indexB) {
  return indexA < indexB
    ? `${indexA}:${indexB}`
    : `${indexB}:${indexA}`;
}

function isEffectivelyVisible(object) {
  let current = object;

  while (current) {
    if (current.visible === false) {
      return false;
    }

    current = current.parent;
  }

  return true;
}

function materialIsVisible(material) {
  if (!material) {
    return true;
  }

  if (material.visible === false) {
    return false;
  }

  if (
    material.transparent === true &&
    Number(material.opacity) <= 0.001
  ) {
    return false;
  }

  return true;
}

function meshHasVisibleMaterial(mesh) {
  if (Array.isArray(mesh.material)) {
    return mesh.material.some(
      materialIsVisible
    );
  }

  return materialIsVisible(
    mesh.material
  );
}

function isAuxiliaryMesh(mesh) {
  const normalizedName =
    String(mesh.name ?? "")
      .toLowerCase();

  return [
    "collision",
    "collider",
    "bounding",
    "bounds",
    "proxy",
    "helper"
  ].some((keyword) =>
    normalizedName.includes(keyword)
  );
}

function collectWorldPoints(object) {
  const points = [];

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    if (
      !child.isMesh ||
      !isEffectivelyVisible(child) ||
      !meshHasVisibleMaterial(child) ||
      isAuxiliaryMesh(child)
    ) {
      return;
    }

    const positionAttribute =
      child.geometry
        ?.attributes
        ?.position;

    if (!positionAttribute) {
      return;
    }

    for (
      let index = 0;
      index < positionAttribute.count;
      index += 1
    ) {
      points.push(
        new THREE.Vector3()
          .fromBufferAttribute(
            positionAttribute,
            index
          )
          .applyMatrix4(
            child.matrixWorld
          )
      );
    }
  });

  return points;
}

function getTrianglePlane(
  vertices,
  triangle
) {
  const pointA =
    vertices[triangle[0]];

  const pointB =
    vertices[triangle[1]];

  const pointC =
    vertices[triangle[2]];

  const normal =
    new THREE.Vector3()
      .crossVectors(
        pointB.clone().sub(pointA),
        pointC.clone().sub(pointA)
      );

  if (
    normal.lengthSq() <
    Number.EPSILON
  ) {
    return null;
  }

  normal.normalize();

  return {
    normal,
    distance:
      normal.dot(pointA)
  };
}

function planesAreEquivalent(
  planeA,
  planeB
) {
  return (
    planeA.normal.dot(
      planeB.normal
    ) >
      1 -
        PLANE_NORMAL_EPSILON &&
    Math.abs(
      planeA.distance -
      planeB.distance
    ) <
      PLANE_DISTANCE_EPSILON
  );
}

function groupTrianglesByPlane(
  vertices,
  triangles
) {
  const groups = [];
  const triangleGroupIds =
    new Array(triangles.length)
      .fill(-1);

  triangles.forEach(
    (triangle, triangleIndex) => {
      const plane =
        getTrianglePlane(
          vertices,
          triangle
        );

      if (!plane) {
        return;
      }

      let groupIndex =
        groups.findIndex(
          (group) =>
            planesAreEquivalent(
              group,
              plane
            )
        );

      if (groupIndex === -1) {
        groupIndex = groups.length;

        groups.push({
          normal:
            plane.normal.clone(),
          distance:
            plane.distance,
          triangleIndices: [],
          vertexIndices:
            new Set()
        });
      }

      const group =
        groups[groupIndex];

      group.triangleIndices.push(
        triangleIndex
      );

      triangle.forEach(
        (vertexIndex) => {
          group.vertexIndices.add(
            vertexIndex
          );
        }
      );

      triangleGroupIds[triangleIndex] =
        groupIndex;
    }
  );

  return {
    groups,
    triangleGroupIds
  };
}

function buildPhysicalEdges(
  triangles,
  triangleGroupIds
) {
  const edgeOwners = new Map();

  triangles.forEach(
    (triangle, triangleIndex) => {
      const groupId =
        triangleGroupIds[
          triangleIndex
        ];

      const triangleEdges = [
        [triangle[0], triangle[1]],
        [triangle[1], triangle[2]],
        [triangle[2], triangle[0]]
      ];

      triangleEdges.forEach(
        ([startIndex, endIndex]) => {
          const key = edgeKey(
            startIndex,
            endIndex
          );

          if (!edgeOwners.has(key)) {
            edgeOwners.set(key, {
              edge:
                startIndex < endIndex
                  ? [
                      startIndex,
                      endIndex
                    ]
                  : [
                      endIndex,
                      startIndex
                    ],
              groupIds: new Set()
            });
          }

          if (groupId >= 0) {
            edgeOwners
              .get(key)
              .groupIds
              .add(groupId);
          }
        }
      );
    }
  );

  return [...edgeOwners.values()]
    .filter((entry) =>
      entry.groupIds.size > 1
    )
    .map((entry) =>
      entry.edge
    );
}

function removeDuplicateDirections(
  vertices,
  edges
) {
  const uniqueDirections = [];
  const simplifiedEdges = [];

  edges.forEach((edge) => {
    const direction =
      vertices[edge[1]]
        .clone()
        .sub(vertices[edge[0]]);

    if (
      direction.lengthSq() <
      Number.EPSILON
    ) {
      return;
    }

    direction.normalize();

    const alreadyExists =
      uniqueDirections.some(
        (existingDirection) =>
          Math.abs(
            existingDirection.dot(
              direction
            )
          ) >
          1 -
            EDGE_DIRECTION_EPSILON
      );

    if (!alreadyExists) {
      uniqueDirections.push(
        direction
      );

      simplifiedEdges.push(edge);
    }
  });

  return simplifiedEdges;
}

function serializeFaces(
  vertices,
  groups
) {
  return groups.map(
    (group, index) => {
      const vertexIndices =
        [...group.vertexIndices];

      const center =
        vertexIndices.reduce(
          (sum, vertexIndex) =>
            sum.add(
              vertices[vertexIndex]
            ),
          new THREE.Vector3()
        );

      if (vertexIndices.length > 0) {
        center.multiplyScalar(
          1 /
          vertexIndices.length
        );
      }

      return {
        id:
          `IMPORTED_FACE_${index}`,
        label:
          `CARA ${index + 1}`,
        vertexIndices,
        triangleIndices:
          [...group.triangleIndices],
        center:
          serializeVector(center),
        normal:
          serializeVector(
            group.normal
          )
      };
    }
  );
}

export function buildImportedCollisionGeometry(
  object
) {
  const points =
    collectWorldPoints(object);

  if (points.length < 4) {
    throw new Error(
      "El model no conté prou geometria visible per crear el volum tècnic."
    );
  }

  const hull =
    new ConvexGeometry(points);

  const positionAttribute =
    hull.attributes.position;

  const vertices = [];
  const vertexMap = new Map();
  const triangles = [];

  for (
    let offset = 0;
    offset < positionAttribute.count;
    offset += 3
  ) {
    const triangle = [];

    for (
      let corner = 0;
      corner < 3;
      corner += 1
    ) {
      const vector =
        new THREE.Vector3()
          .fromBufferAttribute(
            positionAttribute,
            offset + corner
          );

      const key =
        vertexKey(vector);

      if (!vertexMap.has(key)) {
        vertexMap.set(
          key,
          vertices.length
        );

        vertices.push(vector);
      }

      triangle.push(
        vertexMap.get(key)
      );
    }

    if (
      new Set(triangle).size === 3
    ) {
      triangles.push(triangle);
    }
  }

  hull.dispose();

  const {
    groups,
    triangleGroupIds
  } = groupTrianglesByPlane(
    vertices,
    triangles
  );

  /*
    Només conservem arestes compartides
    per triangles de plans diferents.

    Les diagonals interiors de triangles
    coplanaris desapareixen.
  */
  const physicalEdges =
    buildPhysicalEdges(
      triangles,
      triangleGroupIds
    );

  /*
    Per al SAT només cal una aresta per
    cada direcció geomètrica única.

    Això redueix molt les combinacions
    edge x edge sense canviar el resultat.
  */
  const satEdges =
    removeDuplicateDirections(
      vertices,
      physicalEdges
    );

  return {
    vertices:
      vertices.map(
        serializeVector
      ),
    triangles,
    edges: satEdges,
    physicalEdges,
    faces:
      serializeFaces(
        vertices,
        groups
      )
  };
}

export function createCollisionBufferGeometry(
  collisionGeometry
) {
  const geometry =
    new THREE.BufferGeometry();

  const vertices =
    collisionGeometry.vertices.flatMap(
      (vertex) => [
        vertex.x,
        vertex.y,
        vertex.z
      ]
    );

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(
    collisionGeometry.triangles.flat()
  );

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
