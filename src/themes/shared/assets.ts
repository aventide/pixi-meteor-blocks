import type { PlanetTheme } from "../../config/planets";

// Asset URLs respect Vite's base path so builds work under a sub-path
// (e.g. GitHub Pages at /pixi-meteor-blocks/).
export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const planetTiles = (dir: string): PlanetTheme["tiles"] => ({
  red: assetUrl(`assets/${dir}/tile_red.svg`),
  blue: assetUrl(`assets/${dir}/tile_blue.svg`),
  green: assetUrl(`assets/${dir}/tile_green.svg`),
  yellow: assetUrl(`assets/${dir}/tile_yellow.svg`),
  burned: assetUrl(`assets/${dir}/tile_burned.svg`),
});
