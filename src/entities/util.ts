import type {
  BlockGroup,
  BlockGroupId,
  Block,
  FileFragment,
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

export const assignGroupFileRanks = (blocks: Block[]) => {
  // sort blocks in ascending y coord
  const sortedBlocks = blocks.sort(
    (blockA, blockB) => blockA.sprite.y - blockB.sprite.y,
  );

  // then assign ranks
  sortedBlocks.forEach((block, index) => (block.groupFileRank = index + 1));
  return sortedBlocks;
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

export const getBlockAboveInFragment = (
  fileFragment: FileFragment,
  block: Block,
): Block | null => {
  if (block.groupFileRank <= 1) return null;
  return fileFragment.blocks[block.groupFileRank - 2] || null;
};

export const getBlockBelowInFragment = (
  fileFragment: FileFragment,
  block: Block,
): Block | null => {
  if (block.groupFileRank >= fileFragment.blocks.length) return null;
  return fileFragment.blocks[block.groupFileRank] || null;
};

export const swapFileBlockPositions = (
  blocks: Block[],
  subjectBlock: Block,
  otherBlock: Block,
) => {
  // blocks are assumed to be in the same file, hence only y position swap
  const swapYPosition = subjectBlock.sprite.y;
  const swapGroupFileRank = subjectBlock.groupFileRank;

  subjectBlock.sprite.y = otherBlock.sprite.y;
  subjectBlock.groupFileRank = otherBlock.groupFileRank;

  otherBlock.sprite.y = swapYPosition;
  otherBlock.groupFileRank = swapGroupFileRank;

  blocks[subjectBlock.groupFileRank - 1] = subjectBlock;
  blocks[otherBlock.groupFileRank - 1] = otherBlock;
};
