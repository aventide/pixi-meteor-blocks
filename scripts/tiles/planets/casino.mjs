// Casino: art-deco cut corners, neon suit outlines and a faint chip inlay.
// Suits are the colour-blind cue: spade blue, heart red, club green, diamond
// yellow.

import { W, burnedColors, hue, stroke } from "./shared.mjs";

// Suit outlines in the 128px tile space (matching src/themes/casino.ts).
const SUITS = {
  heart:
    "M64 90 C52 81 37 70 37 54 C37 44 44 37 52.5 37 C58 37 62 40 64 45 C66 40 70 37 75.5 37 C84 37 91 44 91 54 C91 70 76 81 64 90 Z",
  diamond: "M64 33 Q74 50 89 63 Q74 76 64 93 Q54 76 39 63 Q54 50 64 33 Z",
  spade:
    "M64 35 C71 46 90 55 90 69 C90 78 83 83 76 83 C72 83 69 81 67 78 Q68 86 75 91 H53 Q60 86 61 78 C59 81 56 83 52 83 C45 83 38 78 38 69 C38 55 57 46 64 35 Z",
  club: "M64 34 C72 34 77.5 40 77.5 47.5 C77.5 50.5 76.5 53 75 55 C76.5 54.6 78 54.4 79 54.4 C86.5 54.4 92 60 92 67.5 C92 75 86.5 80.5 79 80.5 C74 80.5 70 78 68 74 Q68.5 85 76 91 H52 Q59.5 85 60 74 C58 78 54 80.5 49 80.5 C41.5 80.5 36 75 36 67.5 C36 60 41.5 54.4 49 54.4 C50 54.4 51.5 54.6 53 55 C51.5 53 50.5 50.5 50.5 47.5 C50.5 40 56 34 64 34 Z",
};

const suit = (name) => (color, k) => stroke(SUITS[name], color, (W - 1) * k);

const brokenChip = (color, k) =>
  stroke("M64 22 L60 44 L70 58 L62 74 L66 106", color, 3.5 * k) +
  stroke("M60 44 L40 36 M70 58 L94 52 M62 74 L38 86", color, 3 * k);

// A dashed inlay ring, like the edge of a chip.
const chipRing = (c) =>
  `<circle cx="64" cy="64" r="46" fill="none" stroke="${c.contour}" stroke-width="2" stroke-dasharray="10 8" opacity="0.18"/>`;

export const casino = {
  name: "Casino",
  shape: "chamfer2",
  surface: chipRing,
  tiles: {
    red: {
      glyph: suit("heart"),
      colors: hue({
        deep: "#5a0820",
        mid: "#d0204a",
        bright: "#ff5078",
        core: "#ffe4ea",
      }),
    },
    blue: {
      glyph: suit("spade"),
      colors: hue({
        deep: "#0a1a5a",
        mid: "#2252d2",
        bright: "#5c8eff",
        core: "#e6eeff",
      }),
    },
    green: {
      glyph: suit("club"),
      colors: hue({
        deep: "#06401e",
        mid: "#109a4a",
        bright: "#42e282",
        core: "#e0ffe8",
      }),
    },
    yellow: {
      glyph: suit("diamond"),
      colors: hue({
        deep: "#5a3a00",
        mid: "#d89a10",
        bright: "#ffd040",
        core: "#fff6d8",
      }),
    },
    burned: {
      glyph: brokenChip,
      glowBlur: 3,
      glowOpacity: 0.5,
      colors: burnedColors({
        frameHi: "#6a6470",
        body: "#2e2a34",
        glow: "#b08a5a",
        core: "#e6d2b4",
      }),
    },
  },
};
