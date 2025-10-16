import type { BlockGroup, FileBoundary } from "../entities/types";

import { getWorld } from "../world";
import type { BlockGroupId } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  const collisionDelta = Math.min(
    getNearestComparableGroup(blockGroup)[0],
    getGroundCollisionDistance(blockGroup),
  );

  let resolvedDelta = collisionDelta;

  if (targetDelta <= collisionDelta) {
    resolvedDelta = targetDelta;
  } else {
    blockGroup.velocity = 0;
  }

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += resolvedDelta;
    file.boundary.bottom += resolvedDelta;
  });
  blockGroup.blocks.forEach((block) => {
    block.sprite.y += resolvedDelta;
  });
};

const getNearestComparableGroup = (
  subjectGroup: BlockGroup,
): [number, BlockGroup | null] => {
  const { filesMap, blockGroupsMap } = getWorld();

  const subjectFileNumbers = subjectGroup.files.map((file) => file.number);

  const comparableGroupIds: Set<BlockGroupId> = new Set();
  subjectFileNumbers.forEach((fileNumber) => {
    const blockGroupIdsInFile: BlockGroupId[] = filesMap.get(fileNumber) || [];
    blockGroupIdsInFile.forEach((blockGroupId) => {
      if (blockGroupId !== subjectGroup.id) {
        comparableGroupIds.add(blockGroupId);
      }
    });
  });

  const comparableGroups: BlockGroup[] = [];
  Array.from(comparableGroupIds).forEach((blockGroupId) => {
    const blockGroup = blockGroupsMap.get(blockGroupId);
    if (blockGroup) comparableGroups.push(blockGroup);
  });

  // const collidingGroups: Set<BlockGroupId> = new Set();

  let minDistance = Infinity;
  let minDistanceGroup = null;

  subjectGroup.files.forEach((subjectFile) => {
    comparableGroups.forEach((comparableGroup) => {
      // get the file on the comparableGroup
      const comparableFile = comparableGroup.files.find(
        (file) => file.number === subjectFile.number,
      );

      if (comparableFile) {
        const distance = getBoundaryDistance(
          subjectFile.boundary,
          comparableFile.boundary,
        );

        if (distance < minDistance) {
          minDistance = distance;
          minDistanceGroup = comparableGroup;
        }
      }
    });
  });

  return [minDistance, minDistanceGroup];
};

// I hope this is right
const getBoundaryDistance = (
  fromBoundary: FileBoundary,
  toBoundary: FileBoundary,
) => {
  return Math.min(
    Math.abs(fromBoundary.top - toBoundary.bottom),
    Math.abs(fromBoundary.bottom - toBoundary.top),
  );
};

const getGroundCollisionDistance = (blockGroup: BlockGroup): number => {
  const { height } = getWorld();

  // if movement is upwards, this is irrelevant
  if (blockGroup.velocity < 0) return Infinity;

  // otherwise, return the distance between the bottom boundary and the ground
  // THIS IS NOT GENERIC
  return height - blockGroup.files[0].boundary.bottom;
};
