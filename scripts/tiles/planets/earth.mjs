// Earth: the home world. Clean survey-instrument glyphs over faint
// topographic contours.

import { W, hue, stroke } from "./shared.mjs";

const mountain = (color, k) =>
  stroke("M28 90 L54 44 L66 64 L76 50 L100 90 Z", color, W * k);

const water = (color, k) =>
  [46, 64, 82]
    .map((y) => stroke(`M30 ${y} q8.5 -9 17 0 t17 0 t17 0 t17 0`, color, W * k))
    .join("");

const forest = (color, k) =>
  stroke("M64 28 L82 52 H72 L90 78 H38 L56 52 H46 Z", color, W * k) +
  stroke("M64 78 V98", color, W * k);

const sun = (color, k) => {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const p = (r) =>
      `${(64 + Math.cos(a) * r).toFixed(1)} ${(64 + Math.sin(a) * r).toFixed(1)}`;
    return stroke(`M${p(26)} L${p(34)}`, color, W * k);
  }).join("");
  return `<circle cx="64" cy="64" r="14" fill="none" stroke="${color}" stroke-width="${W * k}"/>${rays}`;
};

const ember = (color, k) =>
  stroke("M32 30 L52 52 L46 68 L66 84 L62 102", color, 4 * k) +
  stroke("M52 52 L78 46 L96 32", color, 3.5 * k) +
  stroke("M66 84 L90 78 L100 96", color, 3.5 * k) +
  stroke("M46 68 L28 76", color, 3 * k);

// Faint contour lines, like a survey map, offset towards one corner.
const contours = (c) =>
  [30, 46, 62, 78]
    .map(
      (r) =>
        `<ellipse cx="96" cy="104" rx="${r * 1.25}" ry="${r}" fill="none" stroke="${c.contour}" stroke-width="1.5" opacity="0.16"/>`,
    )
    .join("");

export const earth = {
  name: "Earth",
  shape: "chamferSmall",
  surface: contours,
  tiles: {
    red: {
      glyph: mountain,
      colors: hue({
        deep: "#5a0c16",
        mid: "#c8243a",
        bright: "#ff5560",
        core: "#ffe6e4",
      }),
    },
    blue: {
      glyph: water,
      colors: hue({
        deep: "#0a2560",
        mid: "#1d66e0",
        bright: "#4cb0ff",
        core: "#e4f4ff",
      }),
    },
    green: {
      glyph: forest,
      colors: hue({
        deep: "#073d22",
        mid: "#179a50",
        bright: "#45e889",
        core: "#e2ffec",
      }),
    },
    yellow: {
      glyph: sun,
      colors: hue({
        deep: "#5c3a05",
        mid: "#d79410",
        bright: "#ffcc40",
        core: "#fff7dc",
      }),
    },
    burned: {
      glyph: ember,
      glowBlur: 3,
      colors: {
        frameHi: "#6a6670",
        frameMid: "#2e2c33",
        frameLo: "#111014",
        bodyHi: "#34313a",
        bodyMid: "#1b1a1f",
        bodyLo: "#0a0a0c",
        glow: "#ff6a1a",
        core: "#ffc27a",
        contour: "#8a8590",
      },
    },
  },
};
