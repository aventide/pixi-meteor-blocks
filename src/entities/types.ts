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
  groupId?: BlockGroupId;
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

export type FileFragment = {
  blocks: Block[];
  boundary: FileBoundary;
  overlay: FileOverlay;
  number: FileNumber;
  groupId: BlockGroupId;
};

export type BlockGroupType = "default" | "launch" | "pop";

export type BlockGroup = {
  id: BlockGroupId;
  fileFragments: FileFragment[];
  velocity: number;
  type: BlockGroupType;

  // Cached boundaries for the whole group (min top / max bottom across file fragments).
  boundary: GroupBoundary;
};
