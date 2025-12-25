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

  const subjectFileNumbers = subjectGroup.files.map((file) => file.number);
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

  subjectGroup.files.forEach((subjectFile) => {
    contactableGroups.forEach((contactableGroup) => {
      // get the file on the contactableGroup
      const contactableFile = contactableGroup.files.find(
        (file) => file.number === subjectFile.number,
      );

      if (contactableFile) {
        const distance = getDirectionalBoundaryDistance(
          subjectFile.boundary,
          contactableFile.boundary,
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
  if (blockGroup.files.length === 0) {
    throw new Error("BlockGroup must contain at least one file");
  }

  let bottomBoundary = blockGroup.files[0].boundary.bottom;
  let topBoundary = blockGroup.files[0].boundary.top;

  blockGroup.files.forEach((file) => {
    if (file.boundary.top < topBoundary) topBoundary = file.boundary.top;
    if (file.boundary.bottom > bottomBoundary)
      bottomBoundary = file.boundary.bottom;
  });

  return {
    bottom: bottomBoundary,
    top: topBoundary,
  };
};

export const getIsSpawnPositionOpen = (file: FileNumber): boolean => {
  const { fileBlockGroupsMap } = getWorld();
  const blockSize = getBlockSize();

  const groupsInFile = fileBlockGroupsMap.get(file) || [];
  let isPositionOpen = true;

  groupsInFile.forEach((blockGroup) =>
    blockGroup.files.forEach((blockGroupFile) => {
      if (blockGroupFile.boundary.top < getCeiling() + blockSize)
        isPositionOpen = false;
    }),
  );

  return isPositionOpen;
};

export const getIsGroupInIntersection = (subjectGroup: BlockGroup): boolean => {
  const contactableGroups = getContactableGroups(subjectGroup);
  let isIntersecting = false;

  subjectGroup.files.forEach((subjectFile) => {
    contactableGroups.forEach((contactableGroup) => {
      // get the file on the contactableGroup
      const contactableFile = contactableGroup.files.find(
        (file) => file.number === subjectFile.number,
      );

      if (
        contactableFile &&
        getAreBoundariesIntersecting(
          subjectFile.boundary,
          contactableFile.boundary,
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
  return blockGroup.files.some(
    (blockGroupFile) => blockGroupFile.boundary.bottom === worldHeight,
  );
};

export const getGroupBlockCount = (blockGroup: BlockGroup): number =>
  blockGroup.files.reduce((count, file) => count + file.blocks.length, 0);

export const getMomentum = (blockGroup: BlockGroup): number =>
  blockGroup.velocity *
  blockGroup.files.reduce(
    (totalBlocks, file) => totalBlocks + file.blocks.length,
    0,
  );

export const getFilePlacements = (blockGroup: BlockGroup): FilePlacement[] =>
  blockGroup.files.map((file) => ({
    blocks: file.blocks,
    number: file.number,
  }));

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
  // get the blockGroupFile of this block
  const { blockGroupsMap } = getWorld();
  const group = blockGroupsMap.get(subjectBlock.blockGroupId);
  if (group) {
    // get file associated to block
    const file = group.files.find(
      (groupFile) => groupFile.number === subjectBlock.block.file,
    );

    if (file && subjectBlock.block.groupFileRank > 1) {
      return file.blocks[subjectBlock.block.groupFileRank - 1 - 1];
    }
  }

  return null;
};

export const getFileBlockDirectlyBelow = (subjectBlock: {
  blockGroupId: BlockGroupId;
  block: Block;
}): Block | null => {
  // get the blockGroupFile of this block
  const { blockGroupsMap } = getWorld();
  const group = blockGroupsMap.get(subjectBlock.blockGroupId);

  if (group) {
    // get file associated to block
    const file = group.files.find(
      (groupFile) => groupFile.number === subjectBlock.block.file,
    );

    if (file && subjectBlock.block.groupFileRank < file.blocks.length) {
      return file.blocks[subjectBlock.block.groupFileRank];
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
