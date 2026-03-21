import type {
  BlockGroup,
  BlockGroupId,
  BlockGroupType,
  FileNumber,
  FilePlacement,
} from "../types";

import { getWorld } from "../../world";

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

export const getFilePlacements = (blockGroup: BlockGroup): FilePlacement[] => {
  const filePlacementsMap: Map<FileNumber, FilePlacement> = new Map();

  blockGroup.fileFragments.forEach((fileFragment) => {
    const existingPlacement = filePlacementsMap.get(fileFragment.number);

    if (existingPlacement) {
      existingPlacement.blocks.push(...fileFragment.blocks);
      return;
    }

    filePlacementsMap.set(fileFragment.number, {
      blocks: [...fileFragment.blocks],
      number: fileFragment.number,
    });
  });

  return [...filePlacementsMap.values()];
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
    const subjectFilePlacementBlocks = subjectFilePlacements
      .filter((filePlacement) => filePlacement.number === fileNumber)
      .flatMap((filePlacement) => filePlacement.blocks);

    const otherFilePlacementBlocks = otherFilePlacements
      .filter((filePlacement) => filePlacement.number === fileNumber)
      .flatMap((filePlacement) => filePlacement.blocks);

    mergedFilePlacements.push({
      number: fileNumber,
      blocks: [...subjectFilePlacementBlocks, ...otherFilePlacementBlocks],
    });
  });

  return mergedFilePlacements;
};

export const getCombinedBlockGroupType = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
): BlockGroupType => {
  if (
    subjectBlockGroup.type === "launch" ||
    otherBlockGroup.type === "launch"
  ) {
    return "launch";
  } else if (
    subjectBlockGroup.type === "pop" ||
    otherBlockGroup.type === "pop"
  ) {
    return "pop";
  }

  return "default";
};

export const getCombinedVelocity = (
  subjectBlockGroup: BlockGroup,
  otherBlockGroup: BlockGroup,
): number => {
  return (
    (getMomentum(subjectBlockGroup) + getMomentum(otherBlockGroup)) /
    [
      ...subjectBlockGroup.fileFragments,
      ...otherBlockGroup.fileFragments,
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
