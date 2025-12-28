import { Container, Sprite } from "pixi.js";

export type Coord = {
  x: number;
  y: number;
};

export type BlockGroupId = number;

export type FileNumber = number;

export type Block = {
  sprite: Sprite;
  file: FileNumber;
  groupFileRank: number;
};

export type VerticalBoundary = {
  bottom: number;
  top: number;
};

export type FileBoundary = VerticalBoundary;
export type GroupBoundary = VerticalBoundary;

export type FileOverlay = {
  danger: Container;
  selection: Container;
};

export type FilePlacement = {
  blocks: Block[];
  number: FileNumber;
};

export type BlockGroupFile = {
  blocks: Block[];
  boundary: FileBoundary;
  overlay: FileOverlay;
  number: FileNumber;
};

export type BlockGroupType = "pop" | "launch" | "default";

export type BlockGroup = {
  id: BlockGroupId;
  files: BlockGroupFile[];
  velocity: number;
  type: BlockGroupType;
};
