import type {
  BlockGroup,
  BlockGroupId,
  Block,
  FilePlacement,
  FileNumber,
} from "./types";

import { getBlockSize, getCeiling, getWorld } from "../world";

export const getIsSpawnPositionOpen = (file: FileNumber): boolean => {
  const { fileFragmentsMap } = getWorld();
  const blockSize = getBlockSize();

  const fragmentsInFile = fileFragmentsMap.get(file) || [];
  let isPositionOpen = true;

  fragmentsInFile.forEach((fragment) => {
    if (fragment.boundary.top < getCeiling() + blockSize)
      isPositionOpen = false;
  });

  return isPositionOpen;
};

// input must be a "file" aka blocks all with the same y coord
export const getFileBoundaries = (blocks: Block[]) => {
  const blockSize = getBlockSize();

  let highestTop = blocks[0].sprite.y;
  let lowestBottom = blocks[0].sprite.y + blockSize;

  blocks.forEach((block) => {
    const topOfBlock = block.sprite.y;
    const bottomOfBlock = block.sprite.y + blockSize;
    if (topOfBlock < highestTop) highestTop = topOfBlock;
    if (bottomOfBlock > lowestBottom) lowestBottom = bottomOfBlock;
  });

  return {
    top: highestTop,
    bottom: lowestBottom,
  };
};

export const getIsGroupRooted = (blockGroup: BlockGroup): boolean => {
  const { height: worldHeight } = getWorld();
  return blockGroup.fileFragments.some(
    (fileFragment) => fileFragment.boundary.bottom === worldHeight,
  );
};

export const getGroupBlockCount = (blockGroup: BlockGroup): number =>
  blockGroup.fileFragments.reduce(
    (count, fileFragment) => count + fileFragment.blocks.length,
    0,
  );

export const getMomentum = (blockGroup: BlockGroup): number =>
  blockGroup.velocity * getGroupBlockCount(blockGroup);

export const getFilePlacements = (blockGroup: BlockGroup): FilePlacement[] =>
  blockGroup.fileFragments.map((fileFragment) => ({
    blocks: fileFragment.blocks,
    number: fileFragment.number,
  }));

export const assignBlockGroupId = (blocks: Block[], groupId: BlockGroupId) => {
  blocks.forEach((block) => (block.groupId = groupId));
  return blocks;
};

export const getGroupByBlock = (block: Block): BlockGroup | undefined => {
  const { blockGroupsMap } = getWorld();

  const associatedGroupId = block.groupId;
  if (associatedGroupId) {
    const associatedGroup = blockGroupsMap.get(associatedGroupId);
    if (associatedGroup) {
      return associatedGroup;
    }
  }
};

export const getCombinedFilePlacements = (
  subjectFilePlacements: FilePlacement[],
  otherFilePlacements: FilePlacement[],
): FilePlacement[] => {
  const combinedFileNumbers: Set<FileNumber> = new Set([
    ...subjectFilePlacements.map((fp) => fp.number),
    ...otherFilePlacements.map((fp) => fp.number),
  ]);

  const mergedFilePlacements: FilePlacement[] = [];
  combinedFileNumbers.forEach((fileNumber) => {
    const subjectFilePlacementBlocks =
      subjectFilePlacements.find(
        (filePlacement) => filePlacement.number === fileNumber,
      )?.blocks || [];

    const otherFilePlacementBlocks =
      otherFilePlacements.find(
        (filePlacement) => filePlacement.number === fileNumber,
      )?.blocks || [];

    const mergedFilePlacementBlocks = [
      ...subjectFilePlacementBlocks,
      ...otherFilePlacementBlocks,
    ];

    mergedFilePlacements.push({
      number: fileNumber,
      blocks: mergedFilePlacementBlocks,
    });
  });

  return mergedFilePlacements;
};

export const sortBlocksAscending = (blocks: Block[]) =>
  blocks.sort((blockA, blockB) => blockA.sprite.y - blockB.sprite.y);
