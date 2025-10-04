import { Sprite } from "pixi.js";

export type Coord = {
  x: number;
  y: number;
};

export type Block = {
  sprite: Sprite;
  velocity: number;
  file: number;
  fileOrder: number;
};
