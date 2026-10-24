import { Assets, Texture } from "pixi.js";
import type { PlanetId, PlanetTheme } from "../config/planets";
import { getActivePlanet } from "../world";
import { getRandomIntUpTo } from "../util";

type TileName = keyof PlanetTheme["tiles"];
type TextureSet = Record<TileName, Texture>;
const texturesByPlanet = new Map<PlanetId, TextureSet>();
const loadingByPlanet = new Map<PlanetId, Promise<void>>();

export const loadTextures = async (): Promise<void> => {
  // Capture the planet before awaiting; switching during a load cannot mix sets.
  const { id, theme } = getActivePlanet();
  if (texturesByPlanet.has(id)) return;
  const pending = loadingByPlanet.get(id);
  if (pending) return pending;

  const loading = (async () => {
    const [red, blue, green, yellow, burned] = await Promise.all([
      Assets.load<Texture>(theme.tiles.red),
      Assets.load<Texture>(theme.tiles.blue),
      Assets.load<Texture>(theme.tiles.green),
      Assets.load<Texture>(theme.tiles.yellow),
      Assets.load<Texture>(theme.tiles.burned),
    ]);
    texturesByPlanet.set(id, { red, blue, green, yellow, burned });
  })();
  loadingByPlanet.set(id, loading);
  try {
    await loading;
  } finally {
    loadingByPlanet.delete(id);
  }
};

const requireTexture = (name: TileName): Texture => {
  const texture = texturesByPlanet.get(getActivePlanet().id)?.[name];
  if (!texture) {
    throw new Error(
      `Texture "${name}" has not been initialized for the active planet. Call loadTextures() before using textures.`,
    );
  }
  return texture;
};

export const getBurnedTexture = (): Texture => requireTexture("burned");

export const getRandomBlockTexture = (): Texture => {
  const textureOptions = [
    requireTexture("red"),
    requireTexture("blue"),
    requireTexture("green"),
    requireTexture("yellow"),
  ];
  return textureOptions[getRandomIntUpTo(textureOptions.length)];
};
