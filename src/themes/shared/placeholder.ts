import { Graphics } from "pixi.js";
import type { PlanetTheme } from "../../config/planets";
import { assetUrl } from "./assets";
import { drawVerticalGradient } from "./color";

// Stand-in theme for planets whose art isn't done yet: palette colors,
// main's original tiles, a flat gradient sky, and a circle map icon.
export const createPlaceholderTheme = (
  palette: PlanetTheme["palette"],
): PlanetTheme => ({
  palette,
  tiles: {
    red: assetUrl("assets/tile_red.svg"),
    blue: assetUrl("assets/tile_blue.svg"),
    green: assetUrl("assets/tile_green.svg"),
    yellow: assetUrl("assets/tile_yellow.svg"),
    burned: assetUrl("assets/tile_burned.svg"),
  },
  createBackground: (width, height) => {
    const view = new Graphics();
    view.eventMode = "none";
    const resize = (w: number, h: number) => {
      view.clear();
      drawVerticalGradient(view, 0, 0, w, h, [
        { at: 0, color: palette.bgTop },
        { at: 1, color: palette.bgBottom },
      ]);
    };
    resize(width, height);
    return {
      view,
      update: () => {},
      resize,
      destroy: () => {
        if (!view.destroyed) view.destroy();
      },
    };
  },
  trail: { style: "fire", colors: [0xffffff, palette.accent, 0xff6a1a] },
  mapIcon: (radius) => new Graphics().circle(0, 0, radius).fill(palette.accent),
});
