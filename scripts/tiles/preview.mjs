// Writes a self-contained HTML sheet comparing tile shapes for one planet:
// each shape on the same dense board, plus a 4x zoom of a corner where four
// blocks meet. Nothing is written to public/.
//
//   node scripts/tiles/preview.mjs [planet] [shape...]
//
// Defaults: earth, every registered shape. Output: .tile-preview/<planet>.html

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLANETS } from "./planets/index.mjs";
import { SHAPES } from "./shapes/index.mjs";
import { renderTile } from "./template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const [planetId = "earth", ...shapeArgs] = process.argv.slice(2);
const planet = PLANETS[planetId];
if (!planet) throw new Error(`Unknown planet "${planetId}"`);
const shapes = shapeArgs.length ? shapeArgs : Object.keys(SHAPES);

const COLS = 9;
const ROWS = 14;
const TILE = 40; // px on the full board
const ZOOM = 4;
const HEIGHTS = [9, 11, 8, 12, 10, 7, 11, 9, 6];
const BURNED = new Set(["3:6", "3:7", "3:8", "5:3", "5:4", "1:9", "1:10"]);
const COLORS = ["red", "blue", "green", "yellow"];

// The same seeded layout for every shape, so only the outline differs.
const layout = (() => {
  let seed = 11;
  const rand = () =>
    (seed = (seed * 1664525 + 1013904223) % 4294967296) / 2 ** 32;
  const cells = [];
  HEIGHTS.forEach((height, col) => {
    for (let row = 0; row < height; row++) {
      const name = BURNED.has(`${col}:${row}`)
        ? "burned"
        : COLORS[Math.floor(rand() * COLORS.length)];
      cells.push({ col, row, name });
    }
  });
  return cells;
})();

const dataUri = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// `crop` trims that many px from every side, to centre a zoom on a junction.
const board = (tiles, size, cols, rows, crop = 0) => {
  const imgs = layout
    .filter((cell) => cell.col < cols && cell.row < rows)
    .map(
      ({ col, row, name }) =>
        `<img src="${tiles[name]}" style="left:${col * size - crop}px;top:${(rows - row - 1) * size - crop}px;width:${size}px;height:${size}px" alt="">`,
    )
    .join("");
  return `<div class="board" style="width:${cols * size - 2 * crop}px;height:${rows * size - 2 * crop}px">${imgs}</div>`;
};

const specimens = shapes
  .map((shape) => {
    const tiles = Object.fromEntries(
      Object.entries(planet.tiles).map(([name, tile]) => [
        name,
        dataUri(renderTile(planet, name, tile, shape)),
      ]),
    );
    const current = shape === planet.shape ? " (current)" : "";
    return `<section><h2>${shape}${current}</h2>${board(tiles, TILE, COLS, ROWS)}${board(tiles, TILE * ZOOM, 2, 2, TILE * ZOOM * 0.55)}</section>`;
  })
  .join("");

const html = `<!doctype html>
<meta charset="utf-8">
<title>${planet.name} tile shapes</title>
<style>
  body { margin: 0; padding: 24px; background: #050a18; color: #e6f2ff; font: 14px system-ui, sans-serif; }
  main { display: flex; flex-wrap: wrap; gap: 24px; }
  section { display: grid; gap: 10px; align-content: start; }
  h2 { margin: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
  .board { position: relative; overflow: hidden; background: linear-gradient(#02050f, #0b2f5c); border: 1px solid #1c3358; }
  .board img { position: absolute; }
</style>
<h1>${planet.name} tile shapes</h1>
<main>${specimens}</main>
`;

const outDir = join(root, ".tile-preview");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${planetId}.html`);
writeFileSync(out, html);
console.log(`wrote ${out}`);
