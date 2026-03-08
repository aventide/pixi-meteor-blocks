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
  groupId: BlockGroupId | null;
};

export type VerticalBoundary = {
  bottom: number;
  top: number;
};

export type FileBoundary = VerticalBoundary;
export type FileFragmentBoundary = VerticalBoundary;

export type FileOverlay = {
  danger: Container;
};

export type FilePlacement = {
  blocks: Block[];
  number: FileNumber;
};

export type FileFragment = {
  blocks: Block[];
  boundary: FileFragmentBoundary;
  number: FileNumber;
};

export type GroupFileFragment = FileFragment & {
  overlay: FileOverlay;
  groupId: BlockGroupId;
};

export type BlockGroupType = "default" | "launch" | "pop";

export type BlockGroup = {
  id: BlockGroupId;
  fileFragments: GroupFileFragment[];
  velocity: number;
  type: BlockGroupType;
};
