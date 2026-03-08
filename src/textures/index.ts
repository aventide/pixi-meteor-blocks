import { Assets, Texture } from "pixi.js";
import { getRandomIntUpTo } from "../util";

let redTexture: Texture | null = null;
let blueTexture: Texture | null = null;
let greenTexture: Texture | null = null;
let yellowTexture: Texture | null = null;
let greyTexture: Texture | null = null;

export const loadTextures = async (): Promise<void> => {
  if (
    redTexture &&
    blueTexture &&
    greenTexture &&
    yellowTexture &&
    greyTexture
  ) {
    return;
  }

  const [loadedRed, loadedBlue, loadedGreen, loadedYellow, loadedGrey] =
    await Promise.all([
      Assets.load("/assets/tile_red.svg"),
      Assets.load("/assets/tile_blue.svg"),
      Assets.load("/assets/tile_green.svg"),
      Assets.load("/assets/tile_yellow.svg"),
      Assets.load("/assets/tile_grey.svg"),
    ]);

  redTexture = loadedRed;
  blueTexture = loadedBlue;
  greenTexture = loadedGreen;
  yellowTexture = loadedYellow;
  greyTexture = loadedGrey;
};

const requireTexture = (
  texture: Texture | null,
  textureName: string,
): Texture => {
  if (!texture) {
    throw new Error(
      `Texture "${textureName}" has not been initialized. Call loadTextures() before using textures.`,
    );
  }

  return texture;
};

export const getGreyTexture = (): Texture =>
  requireTexture(greyTexture, "grey");

export const getRandomBlockTexture = (): Texture => {
  const textureOptions: Texture[] = [
    requireTexture(redTexture, "red"),
    requireTexture(blueTexture, "blue"),
    requireTexture(greenTexture, "green"),
    requireTexture(yellowTexture, "yellow"),
  ];

  return textureOptions[getRandomIntUpTo(textureOptions.length)];
};
