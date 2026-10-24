import type {
  BlockGroup,
  BlockGroupId,
  Coord,
  FileFragmentId,
  GroupFileFragment,
  FileNumber,
} from "./entities/types";

import {
  DEFAULT_FILE_COUNT,
  DEFAULT_GRAVITY,
  DEFAULT_POINTER_POSITION,
} from "./constants";
import { Container, Sprite } from "pixi.js";
import { planets, type PlanetId } from "./config/planets";

let activePlanetId: PlanetId = "earth";

export const getActivePlanet = () => planets[activePlanetId];

export const setActivePlanet = (id: PlanetId) => {
  activePlanetId = id;
  setWorldGravity(getActivePlanet().physics.gravity);
};

export type WorldStage = Container & {
  backgroundLayer: Container;
  particlesLayer: Container;
  blocksLayer: Container;
  overlayLayer: Container;
};

export type StageLayers = {
  backgroundLayer: Container;
  particlesLayer: Container;
  blocksLayer: Container;
  overlayLayer: Container;
};

type World = {
  gravity: number;
  height: number;
  width: number;
  stage: Container | null;
  stageLayers: StageLayers;
  blockGroupsByFileNumber: Map<FileNumber, BlockGroup[]>;
  fileFragmentsByFileNumber: Map<FileNumber, GroupFileFragment[]>;
  fileFragmentsById: Map<FileFragmentId, GroupFileFragment>;
  blockGroupsById: Map<BlockGroupId, BlockGroup>;
  nextBlockGroupId: BlockGroupId;
  nextFileFragmentId: FileFragmentId;
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
    backgroundLayer: new Container(),
    particlesLayer: new Container(),
    blocksLayer: new Container(),
    overlayLayer: new Container(),
  },
  blockGroupsById: new Map<BlockGroupId, BlockGroup>(),
  blockGroupsByFileNumber: new Map<FileNumber, BlockGroup[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as BlockGroup[],
    ]),
  ),
  fileFragmentsByFileNumber: new Map<FileNumber, GroupFileFragment[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as GroupFileFragment[],
    ]),
  ),
  fileFragmentsById: new Map<FileFragmentId, GroupFileFragment>(),
  nextBlockGroupId: 1,
  nextFileFragmentId: 1,
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

export const setNextBlockGroupId = (nextBlockGroupId: BlockGroupId) => {
  world.nextBlockGroupId = nextBlockGroupId;
};

export const setNextFileFragmentId = (nextFileFragmentId: FileFragmentId) => {
  world.nextFileFragmentId = nextFileFragmentId;
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
    destroyWorldView(world.selectedFragmentOverlay);
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

export const addToBackgroundLayer = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stageLayers.backgroundLayer.addChild(sprite);
  } else {
    throw "There is no background layer to add this sprite to";
  }
};

export const addToParticlesLayer = (sprite: Sprite | Container) => {
  if (world.stage) {
    world.stageLayers.particlesLayer.addChild(sprite);
  } else {
    throw "There is no particles layer to add this sprite to";
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
    world.stageLayers.backgroundLayer,
    world.stageLayers.particlesLayer,
    world.stageLayers.blocksLayer,
    world.stageLayers.overlayLayer,
  );
};

// World-owned views never own the shared, cached block textures.
export const destroyWorldView = (view: Container) => {
  if (view.destroyed) return;
  for (const child of [...view.children]) destroyWorldView(child);
  for (const filter of view.filters ?? []) filter.destroy();
  view.destroy({ children: true });
};

export const resetWorld = () => {
  // Include detached sprites/overlays still referenced by entities.
  world.fileFragmentsById.forEach((fragment) => {
    fragment.blocks.forEach((block) => {
      destroyWorldView(block.sprite);
      block.groupId = null;
      block.fragmentId = null;
    });
    destroyWorldView(fragment.overlay.danger);
  });
  Object.values(world.stageLayers).forEach((layer) => {
    for (const child of [...layer.children]) destroyWorldView(child);
  });
  // addToStage can also attach run-owned objects outside the four layers.
  const layers = Object.values(world.stageLayers);
  for (const child of [...(world.stage?.children ?? [])]) {
    if (!layers.includes(child)) destroyWorldView(child);
  }

  world.blockGroupsById.clear();
  world.fileFragmentsById.clear();
  world.blockGroupsByFileNumber.clear();
  world.fileFragmentsByFileNumber.clear();
  for (let file = 1; file <= DEFAULT_FILE_COUNT; file++) {
    world.blockGroupsByFileNumber.set(file, []);
    world.fileFragmentsByFileNumber.set(file, []);
  }
  world.nextBlockGroupId = 1;
  world.nextFileFragmentId = 1;
  world.globalPointer = { ...DEFAULT_POINTER_POSITION };
  world.globalPointerDown = false;
  world.selectedFragmentOverlay = null;
  world.gravity = getActivePlanet().physics.gravity;
};
