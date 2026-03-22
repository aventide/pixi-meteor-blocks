import type {
  Block,
  BlockGroup,
  BlockGroupId,
  BlockGroupType,
  FileNumber,
  FilePlacement,
} from "../types";

import { getBlockSize, getWorld } from "../../world";
import { createBlockGroup } from "./index";

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

export const getContiguousFilePlacementsFromBlocks = (
  blocks: Block[],
): FilePlacement[] => {
  const blocksByFileNumber: Map<FileNumber, Block[]> = new Map();
  const blockSize = getBlockSize();

  blocks.forEach((block) => {
    const fileBlocks = blocksByFileNumber.get(block.file);

    if (fileBlocks) {
      fileBlocks.push(block);
      return;
    }

    blocksByFileNumber.set(block.file, [block]);
  });

  const placements: FilePlacement[] = [];

  blocksByFileNumber.forEach((fileBlocks, fileNumber) => {
    const sortedBlocks = [...fileBlocks].sort(
      (blockA, blockB) => blockA.sprite.y - blockB.sprite.y,
    );

    let currentPlacementBlocks: Block[] = [sortedBlocks[0]];

    for (let i = 1; i < sortedBlocks.length; i++) {
      const currentBlock = sortedBlocks[i];
      const previousBlock = sortedBlocks[i - 1];

      if (currentBlock.sprite.y - previousBlock.sprite.y === blockSize) {
        currentPlacementBlocks.push(currentBlock);
      } else {
        placements.push({
          blocks: currentPlacementBlocks,
          number: fileNumber,
        });
        currentPlacementBlocks = [currentBlock];
      }
    }

    placements.push({
      blocks: currentPlacementBlocks,
      number: fileNumber,
    });
  });

  return placements;
};

export const getFilePlacements = (blockGroup: BlockGroup): FilePlacement[] =>
  getContiguousFilePlacementsFromBlocks(
    blockGroup.fileFragments.flatMap((fileFragment) => fileFragment.blocks),
  );

export const createBlockGroupFromBlocks = (
  blocks: Block[],
  velocity: number = 0,
  type: BlockGroupType = "default",
): BlockGroup => {
  const filePlacements = getContiguousFilePlacementsFromBlocks(blocks);

  return createBlockGroup(filePlacements, velocity, type);
};

export const getCombinedFilePlacements = (
  sourceFilePlacements: FilePlacement[],
  targetFilePlacements: FilePlacement[],
): FilePlacement[] => {
  const combinedFileNumbers: Set<FileNumber> = new Set([
    ...sourceFilePlacements.map((fp) => fp.number),
    ...targetFilePlacements.map((fp) => fp.number),
  ]);

  const mergedFilePlacements: FilePlacement[] = [];
  combinedFileNumbers.forEach((fileNumber) => {
    const sourceFilePlacementBlocks = sourceFilePlacements
      .filter((filePlacement) => filePlacement.number === fileNumber)
      .flatMap((filePlacement) => filePlacement.blocks);

    const targetFilePlacementBlocks = targetFilePlacements
      .filter((filePlacement) => filePlacement.number === fileNumber)
      .flatMap((filePlacement) => filePlacement.blocks);

    mergedFilePlacements.push({
      number: fileNumber,
      blocks: [...sourceFilePlacementBlocks, ...targetFilePlacementBlocks],
    });
  });

  return mergedFilePlacements;
};

export const getCombinedBlockGroupType = (
  sourceBlockGroup: BlockGroup,
  targetBlockGroup: BlockGroup,
): BlockGroupType => {
  if (
    sourceBlockGroup.type === "launch" ||
    targetBlockGroup.type === "launch"
  ) {
    return "launch";
  } else if (
    sourceBlockGroup.type === "pop" ||
    targetBlockGroup.type === "pop"
  ) {
    return "pop";
  }

  return "default";
};

export const getCombinedVelocity = (
  sourceBlockGroup: BlockGroup,
  targetBlockGroup: BlockGroup,
): number => {
  return (
    (getMomentum(sourceBlockGroup) + getMomentum(targetBlockGroup)) /
    [
      ...sourceBlockGroup.fileFragments,
      ...targetBlockGroup.fileFragments,
    ].reduce(
      (totalBlocks, fileFragment) => totalBlocks + fileFragment.blocks.length,
      0,
    )
  );
};

export const getBlockGroupById = (
  blockGroupId: BlockGroupId | null,
): BlockGroup | undefined => {
  if (blockGroupId === null) {
    return undefined;
  }

  const { blockGroupsById } = getWorld();

  return blockGroupsById.get(blockGroupId);
};
