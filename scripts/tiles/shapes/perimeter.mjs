// Organic tile outlines: a rounded or cut square whose edge is pushed inward
// by an offset that varies along the perimeter (ripples, chips, erosion).

const SAMPLES = 160;

// A point and inward normal at `distance` along the perimeter of a square
// from `a` to `b` whose corners are rounded or cut at `size`, starting at the
// top-left end of the top edge and running clockwise.
const perimeterPoint = (a, b, size, corner, distance) => {
  const side = b - a - 2 * size;
  const cornerLength =
    corner === "round" ? (Math.PI / 2) * size : Math.SQRT2 * size;
  const segment = side + cornerLength;
  const index = Math.floor(distance / segment) % 4;
  const along = distance - Math.floor(distance / segment) * segment;
  // Each side, as [start, direction, inward normal], then rotate per index.
  const sides = [
    [
      [a + size, a],
      [1, 0],
      [0, 1],
    ],
    [
      [b, a + size],
      [0, 1],
      [-1, 0],
    ],
    [
      [b - size, b],
      [-1, 0],
      [0, -1],
    ],
    [
      [a, b - size],
      [0, -1],
      [1, 0],
    ],
  ];
  const [[sx, sy], [dx, dy], [nx, ny]] = sides[index];
  if (along <= side) {
    return { x: sx + dx * along, y: sy + dy * along, nx, ny };
  }
  // On the corner that follows this side.
  const t = (along - side) / cornerLength;
  const ex = sx + dx * side;
  const ey = sy + dy * side;
  if (corner === "cut") {
    // A straight diagonal to the next side's start.
    return {
      x: ex + (dx + nx) * size * t,
      y: ey + (dy + ny) * size * t,
      nx: (nx - dx) / Math.SQRT2,
      ny: (ny - dy) / Math.SQRT2,
    };
  }
  // Quarter circle around the corner centre, which sits inward of the end.
  const cx = ex + nx * size;
  const cy = ey + ny * size;
  const angle = t * (Math.PI / 2);
  const ox = -nx * Math.cos(angle) + dx * Math.sin(angle);
  const oy = -ny * Math.cos(angle) + dy * Math.sin(angle);
  return { x: cx + ox * size, y: cy + oy * size, nx: -ox, ny: -oy };
};

// `offset(u)` returns how far (px, >= 0) to push the edge inward at perimeter
// fraction u in [0, 1). It is scaled down on inner layers so the panel line
// is calmer than the frame.
export const perimeterShape =
  ({ corner, size, shrink = 0.8, offset }) =>
  (inset) => {
    const a = inset;
    const b = 128 - inset;
    const s = Math.max(0.5, size - (inset - 2) * shrink);
    const calm = Math.max(0, 1 - (inset - 2) / 16);
    const side = b - a - 2 * s;
    const cornerLength =
      corner === "round" ? (Math.PI / 2) * s : Math.SQRT2 * s;
    const total = 4 * (side + cornerLength);
    const points = [];
    for (let i = 0; i < SAMPLES; i++) {
      const u = i / SAMPLES;
      const p = perimeterPoint(a, b, s, corner, u * total);
      const push = offset(u) * calm;
      points.push(
        `${(p.x + p.nx * push).toFixed(2)} ${(p.y + p.ny * push).toFixed(2)}`,
      );
    }
    return `M${points.join(" L")} Z`;
  };

const TAU = Math.PI * 2;

// Ocean: soft corners and a slow ripple along every edge.
export const liquid = perimeterShape({
  corner: "round",
  size: 20,
  offset: (u) =>
    1.6 + 1.4 * Math.sin(u * TAU * 12 + 0.6) + 0.6 * Math.sin(u * TAU * 5),
});

// Desert: small cut corners and chipped, wind-worn edges.
export const eroded = perimeterShape({
  corner: "cut",
  size: 9,
  shrink: 0.5,
  offset: (u) => {
    const n =
      0.5 +
      0.25 * Math.sin(u * TAU * 7 + 1.3) +
      0.15 * Math.sin(u * TAU * 19 + 0.4) +
      0.1 * Math.sin(u * TAU * 43 + 2.1);
    // Flatten most of the edge and leave occasional deeper chips.
    return 3 * Math.max(0, n - 0.35) ** 1.5 * 2.2;
  },
});
