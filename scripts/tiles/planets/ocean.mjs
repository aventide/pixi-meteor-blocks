// Ocean: soft, rippling edges and sea-life glyphs under drifting caustic light.

import { W, burnedColors, dot, hue, polar, stroke } from "./shared.mjs";

const starfish = (color, k) => {
  const points = Array.from({ length: 10 }, (_, i) =>
    polar(64, 67, i % 2 ? 15 : 35, -Math.PI / 2 + (i * Math.PI) / 5),
  );
  return stroke(`M${points.join(" L")} Z`, color, W * k);
};

const fish = (color, k) =>
  stroke(
    "M30 64 Q52 40 78 58 L96 45 L92 64 L96 83 L78 70 Q52 88 30 64 Z",
    color,
    W * k,
  ) + dot(45, 60, 3.5 * k, color);

const coral = (color, k) =>
  stroke(
    "M64 98 V62 M64 76 L46 58 V40 M64 66 L82 48 V34 M46 58 L34 50 M82 48 L94 42",
    color,
    W * k,
  );

const shell = (color, k) => {
  const ribs = [-0.75, -0.38, 0, 0.38, 0.75]
    .map((t) => {
      const a = -Math.PI / 2 + t * 0.95;
      return `M64 94 L${polar(64, 94, 50, a)}`;
    })
    .join(" ");
  return (
    stroke("M64 96 L32 60 Q64 22 96 60 Z", color, W * k) +
    stroke(ribs, color, (W - 2.5) * k)
  );
};

// Bleached coral, cracked and dark: nothing burns underwater.
const bleached = (color, k) =>
  stroke("M64 100 V70 M64 80 L50 64 V52 M64 72 L78 58", color, 4 * k) +
  stroke("M30 34 L44 48 L40 58 M98 92 L86 84 L88 72", color, 3 * k);

// Caustic light: a few loose wavy lines across the face.
const caustics = (c) =>
  [30, 52, 96, 112]
    .map(
      (y, i) =>
        `<path d="M0 ${y} q16 ${i % 2 ? 7 : -7} 32 0 t32 0 t32 0 t32 0" fill="none" stroke="${c.contour}" stroke-width="1.5" opacity="0.14"/>`,
    )
    .join("");

export const ocean = {
  name: "Ocean",
  shape: "liquid",
  surface: caustics,
  tiles: {
    red: {
      glyph: starfish,
      colors: hue({
        deep: "#4e0f22",
        mid: "#c42a52",
        bright: "#ff6088",
        core: "#ffe6ee",
      }),
    },
    blue: {
      glyph: fish,
      colors: hue({
        deep: "#06305e",
        mid: "#1688d4",
        bright: "#5cd6ff",
        core: "#e6faff",
      }),
    },
    green: {
      glyph: coral,
      colors: hue({
        deep: "#05412e",
        mid: "#11a072",
        bright: "#46f0b2",
        core: "#e0fff4",
      }),
    },
    yellow: {
      glyph: shell,
      colors: hue({
        deep: "#5a3e06",
        mid: "#dca020",
        bright: "#ffd860",
        core: "#fff8e0",
      }),
    },
    burned: {
      glyph: bleached,
      glowBlur: 3,
      glowOpacity: 0.5,
      colors: burnedColors({
        frameHi: "#5e6c72",
        body: "#2c3438",
        glow: "#8fb0ba",
        core: "#d6e6ea",
      }),
    },
  },
};
