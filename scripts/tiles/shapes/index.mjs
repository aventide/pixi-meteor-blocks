// Named tile outlines that planets (or single tiles) select with `shape`.
//
// A shape is a function `(inset) => path`: it returns a closed SVG path for
// the tile outline drawn `inset` px in from the 128px tile edge. The template
// calls it at inset 2 (frame), 8 (body) and 14 (panel line). A shape must
// stay inside its inset and keep the centre of the tile (about 28-100px)
// clear for the glyph. Add new families (liquid, eroded, ...) as their own
// modules and register them here.

import {
  chamfer2,
  chamfer4,
  chamferSmall,
  rounded,
  squareHard,
  squareSoft,
} from "./corners.mjs";

export const SHAPES = {
  chamfer4,
  chamfer2,
  chamferSmall,
  square: squareHard,
  squareSoft,
  rounded,
};

// Accepts a registered name or a shape function.
export const resolveShape = (shape) => {
  if (typeof shape === "function") return shape;
  const found = SHAPES[shape];
  if (!found) {
    throw new Error(
      `Unknown tile shape "${shape}". Known shapes: ${Object.keys(SHAPES).join(", ")}`,
    );
  }
  return found;
};

// Cheap sanity check: the outline is closed and every number in it (points,
// arc radii and flags) lies within the 128px tile.
export const checkOutline = (d, label) => {
  if (!/^M/.test(d) || !/Z\s*$/.test(d)) {
    throw new Error(`${label}: outline must start with M and end with Z`);
  }
  for (const n of d.match(/-?\d+(\.\d+)?/g) ?? []) {
    const value = Number(n);
    if (value < 0 || value > 128) {
      throw new Error(`${label}: outline leaves the tile (${value})`);
    }
  }
  return d;
};
