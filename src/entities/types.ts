import { Sprite } from "pixi.js";
import type { BlockGroupId } from "../world";

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
  id: BlockGroupId;
  files: number[];
  velocity: number;
};
