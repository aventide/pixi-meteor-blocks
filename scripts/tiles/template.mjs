// The shared tile template: every planet gets the same layers (frame, bevel,
// body, panel line, emissive glyph) and supplies its own outline shape,
// palette, glyphs and surface detail.

import { checkOutline, resolveShape } from "./shapes/index.mjs";

// A tile's shape comes from the tile itself, else from its planet.
export const renderTile = (planet, name, tile, shapeOverride) => {
  const c = tile.colors;
  const glyph = tile.glyph;
  const shape = resolveShape(shapeOverride ?? tile.shape ?? planet.shape);
  const label = `${planet.name} ${name}`;
  const frame = checkOutline(shape(2), label);
  const body = checkOutline(shape(8), label);
  const panel = checkOutline(shape(14), label);
  return `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <title>${label} tile</title>
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.frameHi}"/>
      <stop offset="0.45" stop-color="${c.frameMid}"/>
      <stop offset="1" stop-color="${c.frameLo}"/>
    </linearGradient>
    <radialGradient id="body" cx="0.5" cy="0.42" r="0.68">
      <stop offset="0" stop-color="${c.bodyHi}"/>
      <stop offset="0.6" stop-color="${c.bodyMid}"/>
      <stop offset="1" stop-color="${c.bodyLo}"/>
    </radialGradient>
    <linearGradient id="topLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.3" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <mask id="top"><rect width="128" height="24" fill="url(#topLight)"/></mask>
    <clipPath id="face"><path d="${body}"/></clipPath>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${tile.glowBlur ?? 4}"/>
    </filter>
  </defs>
  <path d="${frame}" fill="url(#frame)"/>
  <path d="${body}" fill="url(#body)"/>
  <g clip-path="url(#face)">${tile.surface ?? planet.surface?.(c) ?? ""}</g>
  <path d="${panel}" fill="none" stroke="${c.glow}" stroke-width="1.5" opacity="0.28"/>
  <path d="${body}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4" mask="url(#top)" clip-path="url(#face)"/>
  <g filter="url(#glow)" opacity="${tile.glowOpacity ?? 0.95}">${glyph(c.glow, 1.9)}</g>
  <g>${glyph(c.core, 1)}</g>
</svg>
`;
};
