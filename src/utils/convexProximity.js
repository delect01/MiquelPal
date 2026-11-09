/*
  GJK: distància entre dos políedres convexos
  definits pels seus vèrtexs WORLD.

  Només necessita una funció de suport (el
  vèrtex més llunyà en una direcció), així que
  el cost creix amb el nombre de vèrtexs i no
  amb el nombre d'eixos com el SAT.
*/

const MAX_ITERATIONS = 64;
const RELATIVE_EPSILON = 1e-9;
const DEGENERATE_EPSILON = 1e-12;

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function addScaled(a, b, scale) {
  return [
    a[0] + b[0] * scale,
    a[1] + b[1] * scale,
    a[2] + b[2] * scale
  ];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function support(vertices, dx, dy, dz) {
  let best = vertices[0];
  let bestValue = -Infinity;

  for (const vertex of vertices) {
    const value =
      vertex.x * dx +
      vertex.y * dy +
      vertex.z * dz;

    if (value > bestValue) {
      bestValue = value;
      best = vertex;
    }
  }

  return best;
}

/*
  Punt de la diferència de Minkowski A - B més
  llunyà en la direcció (dx, dy, dz).
*/
function minkowskiSupport(
  verticesA,
  verticesB,
  dx,
  dy,
  dz
) {
  const pointA = support(verticesA, dx, dy, dz);
  const pointB = support(verticesB, -dx, -dy, -dz);

  return [
    pointA.x - pointB.x,
    pointA.y - pointB.y,
    pointA.z - pointB.z
  ];
}

/*
  Punt més proper a l'origen dins de cada
  tipus de símplex, juntament amb els vèrtexs
  mínims que el generen.
*/
function closestOnSegment(a, b) {
  const ab = sub(b, a);
  const lengthSq = dot(ab, ab);

  if (lengthSq < DEGENERATE_EPSILON) {
    return { point: a, simplex: [a] };
  }

  const t = -dot(a, ab) / lengthSq;

  if (t <= 0) {
    return { point: a, simplex: [a] };
  }

  if (t >= 1) {
    return { point: b, simplex: [b] };
  }

  return {
    point: addScaled(a, ab, t),
    simplex: [a, b]
  };
}

function closestOnTriangle(a, b, c) {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = [-a[0], -a[1], -a[2]];

  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);

  if (d1 <= 0 && d2 <= 0) {
    return { point: a, simplex: [a] };
  }

  const bp = [-b[0], -b[1], -b[2]];
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);

  if (d3 >= 0 && d4 <= d3) {
    return { point: b, simplex: [b] };
  }

  const vc = d1 * d4 - d3 * d2;

  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return {
      point: addScaled(a, ab, v),
      simplex: [a, b]
    };
  }

  const cp = [-c[0], -c[1], -c[2]];
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);

  if (d6 >= 0 && d5 <= d6) {
    return { point: c, simplex: [c] };
  }

  const vb = d5 * d2 - d1 * d6;

  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return {
      point: addScaled(a, ac, w),
      simplex: [a, c]
    };
  }

  const va = d3 * d6 - d5 * d4;

  if (
    va <= 0 &&
    d4 - d3 >= 0 &&
    d5 - d6 >= 0
  ) {
    const w =
      (d4 - d3) /
      ((d4 - d3) + (d5 - d6));
    return {
      point: addScaled(b, sub(c, b), w),
      simplex: [b, c]
    };
  }

  const sum = va + vb + vc;

  /*
    Triangle degenerat: ens quedem amb el
    millor dels seus costats.
  */
  if (Math.abs(sum) < DEGENERATE_EPSILON) {
    return [
      closestOnSegment(a, b),
      closestOnSegment(b, c),
      closestOnSegment(a, c)
    ].reduce((best, candidate) =>
      dot(candidate.point, candidate.point) <
      dot(best.point, best.point)
        ? candidate
        : best
    );
  }

  const v = vb / sum;
  const w = vc / sum;

  return {
    point: addScaled(
      addScaled(a, ab, v),
      ac,
      w
    ),
    simplex: [a, b, c]
  };
}

function originOutsideFace(p0, p1, p2, opposite) {
  const normal = cross(sub(p1, p0), sub(p2, p0));
  const signOrigin = -dot(p0, normal);
  const signOpposite = dot(sub(opposite, p0), normal);

  /*
    Tetraedre pla: considerem la cara exterior
    perquè es comprovi igualment.
  */
  if (
    Math.abs(signOpposite) <
    DEGENERATE_EPSILON
  ) {
    return true;
  }

  return signOrigin * signOpposite < 0;
}

function closestOnTetrahedron(a, b, c, d) {
  const faces = [
    [a, b, c, d],
    [a, c, d, b],
    [a, d, b, c],
    [b, d, c, a]
  ];

  let best = null;

  faces.forEach(([p0, p1, p2, opposite]) => {
    if (!originOutsideFace(p0, p1, p2, opposite)) {
      return;
    }

    const candidate =
      closestOnTriangle(p0, p1, p2);

    if (
      best === null ||
      dot(candidate.point, candidate.point) <
        dot(best.point, best.point)
    ) {
      best = candidate;
    }
  });

  /*
    L'origen és dins del tetraedre: les formes
    se solapen.
  */
  if (best === null) {
    return { inside: true };
  }

  return best;
}

function closestOnSimplex(simplex) {
  switch (simplex.length) {
    case 1:
      return {
        point: simplex[0],
        simplex
      };
    case 2:
      return closestOnSegment(...simplex);
    case 3:
      return closestOnTriangle(...simplex);
    default:
      return closestOnTetrahedron(...simplex);
  }
}

function isAlreadyInSimplex(simplex, point) {
  return simplex.some((existing) => {
    const difference = sub(existing, point);
    return dot(difference, difference) < DEGENERATE_EPSILON;
  });
}

/*
  Retorna:
    true  -> distància <= tolerància (o solapen)
    false -> distància > tolerància
    null  -> no ha convergit (cal un altre mètode)
*/
export function areConvexVerticesWithinDistance(
  verticesA,
  verticesB,
  tolerance
) {
  if (
    verticesA.length === 0 ||
    verticesB.length === 0
  ) {
    return null;
  }

  const toleranceSq =
    tolerance * tolerance;

  let v = [
    verticesA[0].x - verticesB[0].x,
    verticesA[0].y - verticesB[0].y,
    verticesA[0].z - verticesB[0].z
  ];

  let simplex = [];

  for (
    let iteration = 0;
    iteration < MAX_ITERATIONS;
    iteration += 1
  ) {
    const vv = dot(v, v);

    /*
      |v| és una cota superior de la distància.
    */
    if (vv <= toleranceSq) {
      return true;
    }

    const w = minkowskiSupport(
      verticesA,
      verticesB,
      -v[0],
      -v[1],
      -v[2]
    );

    const vw = dot(v, w);

    /*
      (v·w) / |v| és una cota inferior de la
      distància.
    */
    if (
      vw > 0 &&
      vw * vw > toleranceSq * vv
    ) {
      return false;
    }

    if (
      vv - vw <= RELATIVE_EPSILON * vv ||
      isAlreadyInSimplex(simplex, w)
    ) {
      return Math.sqrt(vv) <= tolerance;
    }

    const result =
      closestOnSimplex([...simplex, w]);

    if (result.inside) {
      return true;
    }

    v = result.point;
    simplex = result.simplex;
  }

  return null;
}
