import { Sprite } from "pixi.js";

export type Coord = {
  x: number;
  y: number;
};

export type Block = {
  sprite: Sprite;
  file: number;
};

export type BlockGroup = {
  blocks: Block[];
  files: number[];
  velocity: number;
};
