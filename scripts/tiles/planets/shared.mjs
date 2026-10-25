// Helpers shared by planet tile specs. A glyph is `(color, k) => svg`: the
// template draws it once wide and blurred (k > 1) for the glow, then once at
// k = 1 for the bright core.

export const W = 7; // core glyph stroke width at 128px

export const stroke = (d, color, width) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const circle = (cx, cy, r, color, width) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${width}"/>`;

export const dot = (cx, cy, r, color) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;

// Point on a circle, formatted for path data.
export const polar = (cx, cy, r, angle) =>
  `${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`;

// A tile colour set from four tones of one hue.
export const hue = ({ deep, mid, bright, core }) => ({
  frameHi: bright,
  frameMid: mid,
  frameLo: deep,
  bodyHi: mid,
  bodyMid: deep,
  bodyLo: deep,
  glow: bright,
  core,
  contour: core,
});

// Burned tiles share a dull, glyph-less body; each planet picks the crack
// colours.
export const burnedColors = ({ frameHi, body, glow, core }) => ({
  frameHi,
  frameMid: "#2e2c33",
  frameLo: "#111014",
  bodyHi: body,
  bodyMid: "#1b1a1f",
  bodyLo: "#0a0a0c",
  glow,
  core,
  contour: "#8a8590",
});
