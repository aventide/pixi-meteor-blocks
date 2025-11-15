import type {
  BlockGroup,
  FileBoundary,
  BlockGroupId,
  Block,
  FilePlacement,
  FileNumber,
} from "./types";

import { getBlockSize, getWorld } from "../world";
import { DEFAULT_SPAWN_POINT } from "../constants";

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

export const getDistanceToCeiling = (blockGroup: BlockGroup): number => {
  const ceiling = 0;
  // const ceiling = worldHeight - blockSize * 12;

  // if movement is downwards, this is irrelevant
  if (blockGroup.velocity > 0) return Infinity;

  let minDistance = Infinity;
  blockGroup.files.forEach((file) => {
    const distance = file.boundary.top - ceiling;
    if (distance < minDistance) minDistance = distance;
  });

  return Math.max(0, minDistance);
};

export const getDistanceToGround = (blockGroup: BlockGroup): number => {
  const { height: worldHeight } = getWorld();

  // if movement is upwards, this is irrelevant
  if (blockGroup.velocity < 0) return Infinity;

  let minDistance = Infinity;
  blockGroup.files.forEach((file) => {
    const distance = worldHeight - file.boundary.bottom;
    if (distance < minDistance) minDistance = distance;
  });

  return minDistance;
};

export const getIsSpawnPositionOpen = (file: FileNumber): boolean => {
  const { fileBlockGroupsMap } = getWorld();
  const blockSize = getBlockSize();

  const groupsInFile = fileBlockGroupsMap.get(file) || [];
  let isPositionOpen = true;

  groupsInFile.forEach((blockGroup) =>
    blockGroup.files.forEach((blockGroupFile) => {
      if (blockGroupFile.boundary.top < (DEFAULT_SPAWN_POINT + 1) * blockSize)
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

    mergedFilePlacements.push({
      number: fileNumber,
      blocks: [...subjectFilePlacementBlocks, ...otherFilePlacementBlocks],
    });
  });

  return mergedFilePlacements;
};
