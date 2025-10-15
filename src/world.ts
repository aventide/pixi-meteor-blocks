import { DEFAULT_FILE_COUNT, DEFAULT_GRAVITY } from "./constants";
import { BlockGroup } from "./entities/types";

export type BlockGroupId = number;
export type FileNumber = number;

// @todo blockGroups and filesMaps could be in their own file
type World = {
  gravity: number;
  height: number;
  width: number;
  blockGroupsMap: Map<BlockGroupId, BlockGroup>;
  filesMap: Map<FileNumber, BlockGroupId[]>;
  blockGroupIdPool: BlockGroupId[];
};

const world: World = {
  gravity: DEFAULT_GRAVITY,
  height: 0,
  width: 0,
  blockGroupsMap: new Map(),
  filesMap: new Map<FileNumber, BlockGroupId[]>(
    Array.from({ length: DEFAULT_FILE_COUNT }, (_, i) => [
      i + 1,
      [] as BlockGroupId[],
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
