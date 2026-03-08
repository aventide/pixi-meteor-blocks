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
export const getFileFragmentBoundary = (blocks: Block[]) => {
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

export const getGroupFileFragment = (
  blockGroup: BlockGroup,
  fileNumber: FileNumber,
): FileFragment | undefined =>
  blockGroup.fileFragments.find(
    (fileFragment) => fileFragment.number === fileNumber,
  );

export const refreshFileFragmentBoundary = (
  fileFragment: FileFragment,
): FileFragment => {
  fileFragment.boundary = getFileFragmentBoundary(fileFragment.blocks);
  return fileFragment;
};

export const assignBlockGroupId = (blocks: Block[], groupId: BlockGroupId) => {
  blocks.forEach((block) => (block.groupId = groupId));
  return blocks;
};

export const getBlockGroupById = (
  blockGroupId: BlockGroupId | null,
): BlockGroup | undefined => {
  if (blockGroupId === null) {
    return undefined;
  }

  const { blockGroupsMap } = getWorld();

  return blockGroupsMap.get(blockGroupId);
};

const removeBlockFromFragment = (
  fileFragment: FileFragment,
  block: Block,
): boolean => {
  const blockIndex = fileFragment.blocks.indexOf(block);
  if (blockIndex === -1) return false;

  fileFragment.blocks.splice(blockIndex, 1);
  return true;
};

export const assignBlockToGroup = (
  block: Block,
  blockGroupId: BlockGroupId,
): BlockGroup => {
  const nextGroup = getBlockGroupById(blockGroupId);
  if (!nextGroup) {
    throw new Error("Cannot assign block to a BlockGroup that does not exist");
  }

  const previousGroup = getBlockGroupById(block.groupId);

  if (previousGroup?.id === nextGroup.id) {
    return nextGroup;
  }

  if (previousGroup) {
    const previousFragment = getGroupFileFragment(previousGroup, block.file);

    if (!previousFragment) {
      throw new Error(
        "Block references a previous BlockGroup, but no matching FileFragment was found",
      );
    }

    const wasRemoved = removeBlockFromFragment(previousFragment, block);
    if (!wasRemoved) {
      throw new Error(
        "Block references a previous BlockGroup, but is missing from its FileFragment",
      );
    }

    if (previousFragment.blocks.length === 0) {
      previousGroup.fileFragments = previousGroup.fileFragments.filter(
        (fileFragment) => fileFragment !== previousFragment,
      );

      const { fileFragmentsMap, fileBlockGroupsMap } = getWorld();
      fileFragmentsMap.set(
        previousFragment.number,
        (fileFragmentsMap.get(previousFragment.number) || []).filter(
          (fileFragment) => fileFragment !== previousFragment,
        ),
      );
      fileBlockGroupsMap.set(
        previousFragment.number,
        (fileBlockGroupsMap.get(previousFragment.number) || []).filter(
          (group) => group.id !== previousGroup.id,
        ),
      );
    } else {
      refreshFileFragmentBoundary(previousFragment);
    }
  }

  const nextFragment = getGroupFileFragment(nextGroup, block.file);

  if (nextFragment) {
    nextFragment.blocks.push(block);
    refreshFileFragmentBoundary(nextFragment);
  } else {
    throw new Error(
      "Cannot assign block to target BlockGroup without an existing FileFragment for that file",
    );
  }

  block.groupId = nextGroup.id;

  return nextGroup;
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
