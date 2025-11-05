import { Container, Sprite } from "pixi.js";

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

export type FilePlacement = {
  blocks: Block[];
  number: FileNumber;
};

export type BlockGroupFile = {
  blocks: Block[];
  boundary: FileBoundary;
  overlay: Container;
  number: FileNumber;
};

export type BlockGroup = {
  id: BlockGroupId;
  files: BlockGroupFile[];
  velocity: number;
};

export type BlockGroupId = number;

export type FileNumber = number;
