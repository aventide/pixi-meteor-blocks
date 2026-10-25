// Moon: hard, machined square tiles with spaceflight glyphs over faint
// crater rings.

import { W, burnedColors, circle, hue, stroke } from "./shared.mjs";

const rocket = (color, k) =>
  stroke(
    "M64 28 Q80 44 78 76 H50 Q48 44 64 28 Z M50 68 L40 86 L50 82 M78 68 L88 86 L78 82 M58 84 L64 98 L70 84",
    color,
    W * k,
  ) + circle(64, 54, 6, color, (W - 2) * k);

// A crescent: the outer circle minus an offset inner circle.
const crescent = (color, k) => {
  const [ox, oy, or] = [60, 66, 32];
  const [ix, iy, ir] = [76, 56, 27];
  // Intersection points of the two circles.
  const dx = ix - ox;
  const dy = iy - oy;
  const d = Math.hypot(dx, dy);
  const a = (or * or - ir * ir + d * d) / (2 * d);
  const h = Math.sqrt(or * or - a * a);
  const mx = ox + (a * dx) / d;
  const my = oy + (a * dy) / d;
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d];
  const p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return stroke(
    `M${f(p1)} A${or} ${or} 0 1 0 ${f(p2)} A${ir} ${ir} 0 0 1 ${f(p1)} Z`,
    color,
    W * k,
  );
};

const ringedPlanet = (color, k) =>
  circle(64, 64, 18, color, W * k) +
  `<ellipse cx="64" cy="64" rx="38" ry="11" transform="rotate(-18 64 64)" fill="none" stroke="${color}" stroke-width="${(W - 1.5) * k}"/>`;

const star = (color, k) =>
  stroke(
    "M60 30 Q64 60 94 64 Q64 68 60 98 Q56 68 26 64 Q56 60 60 30 Z",
    color,
    W * k,
  ) + stroke("M94 30 V42 M88 36 H100", color, (W - 3) * k);

// Basalt with cold fractures: no air, no embers.
const fractured = (color, k) =>
  stroke("M30 32 L50 50 L44 66 L64 80 L60 100", color, 3.5 * k) +
  stroke("M50 50 L76 44 L96 34 M64 80 L88 76 L98 92", color, 3 * k);

const craters = (c) =>
  [
    [30, 98, 10],
    [100, 30, 7],
    [104, 102, 5],
    [24, 34, 4],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c.contour}" stroke-width="1.5" opacity="0.18"/>`,
    )
    .join("");

export const moon = {
  name: "Moon",
  shape: "square",
  surface: craters,
  tiles: {
    red: {
      glyph: rocket,
      colors: hue({
        deep: "#520c18",
        mid: "#c4263a",
        bright: "#ff5a68",
        core: "#ffe8ea",
      }),
    },
    blue: {
      glyph: crescent,
      colors: hue({
        deep: "#0c2462",
        mid: "#2466dc",
        bright: "#62a8ff",
        core: "#e8f2ff",
      }),
    },
    green: {
      glyph: ringedPlanet,
      colors: hue({
        deep: "#083c24",
        mid: "#1a9852",
        bright: "#52ea92",
        core: "#e4ffee",
      }),
    },
    yellow: {
      glyph: star,
      colors: hue({
        deep: "#5a3c06",
        mid: "#d49812",
        bright: "#ffd248",
        core: "#fff8de",
      }),
    },
    burned: {
      glyph: fractured,
      glowBlur: 3,
      glowOpacity: 0.5,
      colors: burnedColors({
        frameHi: "#62666e",
        body: "#2a2c32",
        glow: "#8aa4c8",
        core: "#d4e2f4",
      }),
    },
  },
};
