// Generates planet tile SVGs from the shared template in template.mjs, so
// every planet shares the same hardware while varying its outline shape,
// palette, glyphs and surface detail.
//
//   node scripts/tiles/generate.mjs [planet...]
//
// Output: public/assets/planets/<planet>/tile_<name>.svg

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLANETS } from "./planets/index.mjs";
import { renderTile } from "./template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const targets = process.argv.slice(2);
for (const id of targets.length ? targets : Object.keys(PLANETS)) {
  const planet = PLANETS[id];
  if (!planet) throw new Error(`Unknown planet "${id}"`);
  const dir = join(root, "public/assets/planets", id);
  mkdirSync(dir, { recursive: true });
  for (const [name, tile] of Object.entries(planet.tiles)) {
    writeFileSync(
      join(dir, `tile_${name}.svg`),
      renderTile(planet, name, tile),
    );
  }
  console.log(`wrote ${Object.keys(planet.tiles).length} tiles for ${id}`);
}
