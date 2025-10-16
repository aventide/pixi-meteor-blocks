import { Sprite } from "pixi.js";
import type { BlockGroupId, FileNumber } from "../world";

export type Coord = {
  x: number;
  y: number;
};

export type Block = {
  sprite: Sprite;
  file: number;
};

export type FileBoundary = {
  bottom: number;
  top: number;
};

export type BlockGroupFile = {
  blocks: Block[];
  boundary: FileBoundary;
  number: FileNumber;
};

export type BlockGroup = {
  blocks: Block[];
  id: BlockGroupId;
  files: BlockGroupFile[];
  velocity: number;
};
