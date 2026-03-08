import type {
  BlockGroup,
  BlockGroupId,
  Coord,
  GroupFileFragment,
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

export type StageLayers = {
  blocksLayer: Container;
  overlayLayer: Container;
};

type World = {
  gravity: number;
  height: number;
  width: number;
  stage: Container | null;
  stageLayers: StageLayers;
  fileBlockGroupsMap: Map<FileNumber, BlockGroup[]>;
  fileFragmentsMap: Map<FileNumber, GroupFileFragment[]>;
  blockGroupsMap: Map<BlockGroupId, BlockGroup>;
  blockGroupIdPool: BlockGroupId[];
  globalPointer: Coord;
  globalPointerDown: boolean;
  selectedFragmentOverlay: Container | null;
};

const world: World = {
  gravity: DEFAULT_GRAVITY,
  height: 0,
  width: 0,
  stage: null,
  stageLayers: {
    blocksLayer: new Container(),
    overlayLayer: new Container(),
  },
  blockGroupsMap: new Map<BlockGroupId, BlockGroup>(),
  fileBlockGroupsMap: new Map<FileNumber, BlockGroup[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as BlockGroup[],
    ]),
  ),
  fileFragmentsMap: new Map<FileNumber, GroupFileFragment[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as GroupFileFragment[],
    ]),
  ),
  blockGroupIdPool: Array.from({ length: 300 }, (_, i) => 300 - i),
  globalPointer: DEFAULT_POINTER_POSITION,
  globalPointerDown: false,
  selectedFragmentOverlay: null,
};

export const getWorld = () => world;
export const getBlockSize = () => world.width / DEFAULT_FILE_COUNT;
export const getCeiling = () => 0 - 2 * getBlockSize();
export const getFloor = () => world.height;
export const getVeil = () => 0;

export const setWorldDimensions = (height: number, width: number) => {
  world.height = height;
  world.width = width;
  // const blockSize = width / DEFAULT_FILE_COUNT;
  // world.height = blockSize * DEFAULT_FILE_BLOCKS_LIMIT;
  // world.width = width;
};

export const setWorldGravity = (gravity: number) => {
  world.gravity = gravity;
};

export const setGlobalPointer = (newCoord: Coord) => {
  world.globalPointer = newCoord;
};

export const setGlobalPointerDown = (isPointerDown: boolean) => {
  world.globalPointerDown = isPointerDown;
};

export const setSelectedFragmentOverlay = (
  newSelectedFragmentOverlay: Container | null,
) => {
  if (world.selectedFragmentOverlay) {
    world.stageLayers.overlayLayer.removeChild(world.selectedFragmentOverlay);
  }

  world.selectedFragmentOverlay = newSelectedFragmentOverlay;

  if (newSelectedFragmentOverlay) {
    world.stageLayers.overlayLayer.addChild(newSelectedFragmentOverlay);
  }
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
    world.stageLayers.blocksLayer.addChild(sprite);
  } else {
    throw "There is no blocks layer to add this sprite to";
  }
};

export const addToOverlayLayer = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stageLayers.overlayLayer.addChild(sprite);
  } else {
    throw "There is no overlay layer to add this sprite to";
  }
};

export const initializeStage = (stage: Container) => {
  world.stage = stage;

  const selectedFragmentOverlay = new Container();
  world.selectedFragmentOverlay = selectedFragmentOverlay;
  world.stageLayers.overlayLayer.addChild(selectedFragmentOverlay);

  // add our currently-empty layers to the stage
  // ORDER MATTERS HERE
  world.stage.addChild(
    world.stageLayers.blocksLayer,
    world.stageLayers.overlayLayer,
  );
};
