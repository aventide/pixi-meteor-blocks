import type {
  BlockGroup,
  BlockGroupId,
  Coord,
  FileNumber,
} from "./entities/types";

import {
  DEFAULT_FILE_COUNT,
  DEFAULT_GRAVITY,
  DEFAULT_POINTER_POSITION,
} from "./constants";
import { Container, Sprite } from "pixi.js";

export type WorldStage = Container & {
  blocksLayer: Container;
  overlayLayer: Container;
};

type World = {
  gravity: number;
  height: number;
  width: number;
  stage: WorldStage | null;
  fileBlockGroupsMap: Map<FileNumber, BlockGroup[]>;
  blockGroupsMap: Map<BlockGroupId, BlockGroup>;
  blockGroupIdPool: BlockGroupId[];
  globalPointer: Coord;
  globalPointerDown: boolean;
  selectedBlockGroup: BlockGroup | null;
};

const world: World = {
  gravity: DEFAULT_GRAVITY,
  height: 0,
  width: 0,
  stage: null,
  blockGroupsMap: new Map<BlockGroupId, BlockGroup>(),
  fileBlockGroupsMap: new Map<FileNumber, BlockGroup[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as BlockGroup[],
    ]),
  ),
  blockGroupIdPool: Array.from({ length: 300 }, (_, i) => 300 - i),
  globalPointer: DEFAULT_POINTER_POSITION,
  globalPointerDown: false,
  selectedBlockGroup: null,
};

export const getWorld = () => world;
export const getBlockSize = () => world.width / DEFAULT_FILE_COUNT;

export const setWorldDimensions = (height: number, width: number) => {
  world.height = height;
  world.width = width;
};

export const setWorldGravity = (gravity: number) => {
  world.gravity = gravity;
};

export const setStage = (newStage: WorldStage) => {
  world.stage = newStage;
};

export const setGlobalPointer = (newCoord: Coord) => {
  world.globalPointer = newCoord;
};

export const setGlobalPointerDown = (isPointerDown: boolean) => {
  world.globalPointerDown = isPointerDown;
};

export const setSelectedBlockGroup = (
  newSelectedBlockGroup: BlockGroup | null,
) => {
  world.selectedBlockGroup = newSelectedBlockGroup;
};

export const addToStage = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stage.addChild(sprite);
  } else {
    throw "There is no stage to add this sprite to";
  }
};

export const addToBlocksLayer = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stage.blocksLayer.addChild(sprite);
  } else {
    throw "There is no blocks layer to add this sprite to";
  }
};

export const addToOverlayLayer = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stage.overlayLayer.addChild(sprite);
  } else {
    throw "There is no blocks layer to add this sprite to";
  }
};
