import { Assets, Texture } from "pixi.js";
import { DEFAULT_FILE_COUNT } from "./constants";

const getRandomIntUpTo = (upToNumber: number) =>
  Math.floor(Math.random() * upToNumber);

const getRandomFileNumber = () => getRandomIntUpTo(DEFAULT_FILE_COUNT);

const redTexture: Texture = await Assets.load("/assets/tile_red.svg");
const blueTexture: Texture = await Assets.load("/assets/tile_blue.svg");
const greenTexture: Texture = await Assets.load("/assets/tile_green.svg");
const yellowTexture: Texture = await Assets.load("/assets/tile_yellow.svg");

const getRandomBlockTexture = (): Texture => {
  const textureOptions: Texture[] = [
    redTexture,
    blueTexture,
    greenTexture,
    yellowTexture,
  ];

  return textureOptions[getRandomIntUpTo(textureOptions.length)];
};

export { getRandomFileNumber, getRandomIntUpTo, getRandomBlockTexture };
