import { DEFAULT_FILE_COUNT, DEFAULT_GRAVITY } from "./constants";
import { BlockGroup } from "./entities/types";

export type BlockGroupId = number;
export type FileNumber = number;

type World = {
  gravity: number;
  height: number;
  width: number;
  fileBlockGroupsMap: Map<FileNumber, BlockGroup[]>;
  blockGroupsMap: Map<BlockGroupId, BlockGroup>;
  blockGroupIdPool: BlockGroupId[];
};

const world: World = {
  gravity: DEFAULT_GRAVITY,
  height: 0,
  width: 0,
  blockGroupsMap: new Map<BlockGroupId, BlockGroup>(),
  fileBlockGroupsMap: new Map<FileNumber, BlockGroup[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as BlockGroup[],
    ]),
  ),
  blockGroupIdPool: Array.from({ length: 300 }, (_, i) => 300 - i),
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
