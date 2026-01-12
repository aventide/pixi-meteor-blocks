import { Assets, Texture } from "pixi.js";
import { getRandomIntUpTo } from "../util";

const redTexture: Texture = await Assets.load("/assets/tile_red.svg");
const blueTexture: Texture = await Assets.load("/assets/tile_blue.svg");
const greenTexture: Texture = await Assets.load("/assets/tile_green.svg");
const yellowTexture: Texture = await Assets.load("/assets/tile_yellow.svg");
export const greyTexture: Texture = await Assets.load("/assets/tile_grey.svg");

export const getRandomBlockTexture = (): Texture => {
  const textureOptions: Texture[] = [
    redTexture,
    blueTexture,
    greenTexture,
    yellowTexture,
  ];

  return textureOptions[getRandomIntUpTo(textureOptions.length)];
};
