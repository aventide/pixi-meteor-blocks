import type { BlockGroup, FileBoundary, BlockGroupId } from "./types";

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

export const getNearestGroup = (
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
