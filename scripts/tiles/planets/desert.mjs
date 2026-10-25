// Desert: wind-worn stone edges, carved glyphs and faint sediment strata.

import { W, burnedColors, circle, hue, stroke } from "./shared.mjs";

const eye = (color, k) =>
  stroke("M28 66 Q64 36 100 66 Q64 96 28 66 Z", color, W * k) +
  circle(64, 66, 10, color, W * k) +
  stroke("M64 28 V38 M42 34 L47 42 M86 34 L81 42", color, (W - 2) * k);

const scarab = (color, k) =>
  `<ellipse cx="64" cy="72" rx="17" ry="22" fill="none" stroke="${color}" stroke-width="${W * k}"/>` +
  circle(64, 42, 7, color, (W - 1) * k) +
  stroke("M64 52 V92", color, (W - 2.5) * k) +
  stroke(
    "M47 62 L34 54 M47 76 L32 78 M50 88 L40 98 M81 62 L94 54 M81 76 L96 78 M78 88 L88 98",
    color,
    (W - 2.5) * k,
  );

const cactus = (color, k) =>
  stroke("M64 96 V32 M64 70 H50 V52 M64 58 H78 V42 M40 96 H88", color, W * k);

const pyramid = (color, k) =>
  stroke("M30 94 L64 48 L98 94 Z M64 48 L74 94", color, W * k) +
  circle(64, 28, 7, color, (W - 1.5) * k);

const charred = (color, k) =>
  stroke("M30 30 L50 50 L44 66 L64 80 L60 100", color, 3.5 * k) +
  stroke("M50 50 L76 44 L96 34 M64 80 L88 76 L98 92", color, 3 * k);

// Sediment strata: wavy horizontal bands across the stone.
const strata = (c) =>
  [34, 48, 84, 98, 110]
    .map(
      (y, i) =>
        `<path d="M0 ${y} q32 ${i % 2 ? 3 : -3} 64 0 t64 0" fill="none" stroke="${c.contour}" stroke-width="${i % 2 ? 1 : 2}" opacity="0.13"/>`,
    )
    .join("");

export const desert = {
  name: "Desert",
  shape: "eroded",
  surface: strata,
  tiles: {
    red: {
      glyph: eye,
      colors: hue({
        deep: "#4a1210",
        mid: "#b8322a",
        bright: "#ff6a4a",
        core: "#ffe8dc",
      }),
    },
    blue: {
      glyph: scarab,
      colors: hue({
        deep: "#063a40",
        mid: "#139096",
        bright: "#4ae8e0",
        core: "#e0fffc",
      }),
    },
    green: {
      glyph: cactus,
      colors: hue({
        deep: "#0e3a1a",
        mid: "#2e8a3e",
        bright: "#80e07a",
        core: "#eeffe4",
      }),
    },
    yellow: {
      glyph: pyramid,
      colors: hue({
        deep: "#5a3a08",
        mid: "#d08e1a",
        bright: "#ffc848",
        core: "#fff4d8",
      }),
    },
    burned: {
      glyph: charred,
      glowBlur: 3,
      glowOpacity: 0.7,
      colors: burnedColors({
        frameHi: "#6e5a4c",
        body: "#3a2c26",
        glow: "#e0602a",
        core: "#ffb070",
      }),
    },
  },
};
