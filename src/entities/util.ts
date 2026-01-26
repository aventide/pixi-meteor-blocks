import type {
  BlockGroup,
  FileBoundary,
  BlockGroupId,
  Block,
  FilePlacement,
  FileNumber,
  GroupBoundary,
} from "./types";

import { getBlockSize, getCeiling, getWorld } from "../world";

// get groups that the given group could possibly contact
export const getContactableGroups = (subjectGroup: BlockGroup) => {
  const { fileBlockGroupsMap } = getWorld();

  const subjectFileNumbers = subjectGroup.fileFragments.map(
    (fileFragment) => fileFragment.number,
  );
  const contactableGroupIds: Set<BlockGroupId> = new Set();
  const contactableGroups: BlockGroup[] = [];

  subjectFileNumbers.forEach((subjectFileNumber) => {
    const otherGroupsInFile: BlockGroup[] = (
      fileBlockGroupsMap.get(subjectFileNumber) || []
    ).filter((group) => group.id !== subjectGroup.id);

    otherGroupsInFile.forEach((otherGroup) => {
      if (!contactableGroupIds.has(otherGroup.id)) {
        contactableGroupIds.add(otherGroup.id);
        contactableGroups.push(otherGroup);
      }
    });
  });

  return contactableGroups;
};

export const getDirectionallyNearestGroup = (
  subjectGroup: BlockGroup,
): [BlockGroup | null, number] => {
  const contactableGroups = getContactableGroups(subjectGroup);

  let minDistance = Infinity;
  let minDistanceGroup = null;

  subjectGroup.fileFragments.forEach((subjectFile) => {
    contactableGroups.forEach((contactableGroup) => {
      // get the file fragment on the contactableGroup
      const contactableFileFragment = contactableGroup.fileFragments.find(
        (fileFragment) => fileFragment.number === subjectFile.number,
      );

      if (contactableFileFragment) {
        const distance = getDirectionalBoundaryDistance(
          subjectFile.boundary,
          contactableFileFragment.boundary,
          subjectGroup.velocity,
        );

        if (distance < minDistance) {
          minDistance = distance;
          minDistanceGroup = contactableGroup;
        }
      }
    });
  });

  return [minDistanceGroup, minDistance];
};

// get the distance between two group boundary sets, with respect to the velocity of
// a subject boundary set
export const getDirectionalBoundaryDistance = (
  subjectBoundary: FileBoundary,
  otherBoundary: FileBoundary,
  subjectVelocity: number,
): number => {
  if (subjectVelocity === 0) return Infinity;

  const distance =
    subjectVelocity > 0
      ? otherBoundary.top - subjectBoundary.bottom
      : subjectBoundary.top - otherBoundary.bottom;

  return distance >= 0 ? distance : Infinity;
};

export const getGroupBoundaries = (blockGroup: BlockGroup): GroupBoundary => {
  if (blockGroup.fileFragments.length === 0) {
    throw new Error("BlockGroup must contain at least one file fragment");
  }

  let bottomBoundary = blockGroup.fileFragments[0].boundary.bottom;
  let topBoundary = blockGroup.fileFragments[0].boundary.top;

  blockGroup.fileFragments.forEach((fileFragment) => {
    if (fileFragment.boundary.top < topBoundary)
      topBoundary = fileFragment.boundary.top;
    if (fileFragment.boundary.bottom > bottomBoundary)
      bottomBoundary = fileFragment.boundary.bottom;
  });

  return {
    bottom: bottomBoundary,
    top: topBoundary,
  };
};

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

export const getIsGroupInIntersection = (subjectGroup: BlockGroup): boolean => {
  const contactableGroups = getContactableGroups(subjectGroup);
  let isIntersecting = false;

  subjectGroup.fileFragments.forEach((subjectFileFragment) => {
    contactableGroups.forEach((contactableGroup) => {
      // get the file fragment on the contactableGroup
      const contactableFileFragment = contactableGroup.fileFragments.find(
        (fileFragment) => fileFragment.number === subjectFileFragment.number,
      );

      if (
        contactableFileFragment &&
        getAreBoundariesIntersecting(
          subjectFileFragment.boundary,
          contactableFileFragment.boundary,
        )
      )
        isIntersecting = true;
    });
  });

  return isIntersecting;
};

export const getAreBoundariesIntersecting = (
  subjectBoundary: FileBoundary,
  otherBoundary: FileBoundary,
) => {
  return (
    Math.min(subjectBoundary.bottom, otherBoundary.bottom) >
    Math.max(subjectBoundary.top, otherBoundary.top)
  );
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

export const getFileBlockDirectlyAbove = (subjectBlock: {
  blockGroupId: BlockGroupId;
  block: Block;
}): Block | null => {
  // get the file fragment of this block
  const { blockGroupsMap } = getWorld();
  const group = blockGroupsMap.get(subjectBlock.blockGroupId);
  if (group) {
    // get fragment associated to block's file
    const fragment = group.fileFragments.find(
      (fileFragment) => fileFragment.number === subjectBlock.block.file,
    );

    if (fragment && subjectBlock.block.groupFileRank > 1) {
      return fragment.blocks[subjectBlock.block.groupFileRank - 1 - 1];
    }
  }

  return null;
};

export const getFileBlockDirectlyBelow = (subjectBlock: {
  blockGroupId: BlockGroupId;
  block: Block;
}): Block | null => {
  // get the file fragment of this block
  const { blockGroupsMap } = getWorld();
  const group = blockGroupsMap.get(subjectBlock.blockGroupId);

  if (group) {
    // get fragment associated to block's file
    const fragment = group.fileFragments.find(
      (fileFragment) => fileFragment.number === subjectBlock.block.file,
    );

    if (fragment && subjectBlock.block.groupFileRank < fragment.blocks.length) {
      return fragment.blocks[subjectBlock.block.groupFileRank];
    }
  }

  return null;
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
