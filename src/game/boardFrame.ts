import { Graphics } from "pixi.js";
import type { PlanetTheme } from "../config/planets";
import { DEFAULT_FILE_COUNT } from "../constants";

// The play well behind the blocks: a dark translucent glass panel with faint
// column guides and glowing side rails in the planet's accent color. Drawn in
// board space (origin at the board's top-left).
export const createBoardFrame = (
  width: number,
  height: number,
  palette: PlanetTheme["palette"],
) => {
  const g = new Graphics();
  g.eventMode = "none";
  g.rect(0, 0, width, height).fill({ color: 0x0a1a3a, alpha: 0.16 });

  const column = width / DEFAULT_FILE_COUNT;
  for (let i = 1; i < DEFAULT_FILE_COUNT; i++) {
    g.rect(Math.round(i * column), 0, 1, height).fill({
      color: 0xffffff,
      alpha: 0.06,
    });
  }

  // Side rails: a soft wide glow under a thin bright line.
  for (const x of [0, width]) {
    g.rect(x - 4, 0, 8, height).fill({ color: palette.accent, alpha: 0.12 });
    g.rect(x - 1, 0, 2, height).fill({ color: palette.accent, alpha: 0.85 });
  }
  return g;
};
