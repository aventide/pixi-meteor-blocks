import type { BlockGroup, FileBoundary } from "../entities/types";
import type { BlockGroupId } from "../world";

import { getWorld } from "../world";

export const getLeadingBlockInGroup = (blockGroup: BlockGroup) => {
  // this assumes the blockGroup has at least one block
  let leadingBlock = blockGroup.blocks[0];

  const fallingFn = (a: number, b: number) => a > b;
  const risingFn = (a: number, b: number) => a < b;
  const compareFn = blockGroup.velocity >= 0 ? fallingFn : risingFn;

  blockGroup.blocks.forEach((block) => {
    if (compareFn(block.sprite.y, leadingBlock.sprite.y)) {
      leadingBlock = block;
    }
  });

  return leadingBlock;
};

export const getNearestGroup = (
  subjectGroup: BlockGroup,
): [BlockGroup | null, number] => {
  const { fileBlockGroupsMap } = getWorld();

  const subjectFileNumbers = subjectGroup.files.map((file) => file.number);
  const comparableGroupIds: Set<BlockGroupId> = new Set();
  const comparableGroups: BlockGroup[] = [];

  subjectFileNumbers.forEach((subjectFileNumber) => {
    const otherGroupsInFile: BlockGroup[] = (
      fileBlockGroupsMap.get(subjectFileNumber) || []
    ).filter((group) => group.id !== subjectGroup.id);

    otherGroupsInFile.forEach((otherGroup) => {
      if (!comparableGroupIds.has(otherGroup.id)) {
        comparableGroupIds.add(otherGroup.id);
        comparableGroups.push(otherGroup);
      }
    });
  });

  let minDistance = Infinity;
  let minDistanceGroup = null;

  subjectGroup.files.forEach((subjectFile) => {
    comparableGroups.forEach((comparableGroup) => {
      // get the file on the comparableGroup
      const comparableFile = comparableGroup.files.find(
        (file) => file.number === subjectFile.number,
      );

      if (comparableFile) {
        const distance = getDirectionalBoundaryDistance(
          subjectFile.boundary,
          comparableFile.boundary,
          subjectGroup.velocity,
        );

        if (distance < minDistance) {
          minDistance = distance;
          minDistanceGroup = comparableGroup;
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

export const getCeilingDistance = (blockGroup: BlockGroup): number => {
  const ceiling = 0;

  // if movement is downwards, this is irrelevant
  if (blockGroup.velocity > 0) return Infinity;

  let minDistance = Infinity;

  blockGroup.files.forEach((file) => {
    const distance = file.boundary.top - ceiling;
    if (distance < minDistance) minDistance = distance;
  });

  return minDistance;
};

export const getGroundDistance = (blockGroup: BlockGroup): number => {
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
