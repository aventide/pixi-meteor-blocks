import type { BlockGroup, FileBoundary } from "../entities/types";

import { getWorld } from "../world";
import type { BlockGroupId } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  const [, nearestGroupDistance] = getNearestGroup(blockGroup, isBoundaryBelow);
  const groundDistance = getGroundDistance(blockGroup);

  const collisionDelta = Math.min(nearestGroupDistance, groundDistance);

  let resolvedDelta = collisionDelta;

  // check if intended movement is less than possible collision distance
  if (targetDelta <= collisionDelta) {
    resolvedDelta = targetDelta;
  } else {
    resolvedDelta = collisionDelta;
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

const getNearestGroup = (
  subjectGroup: BlockGroup,
  boundaryFilter: (
    subjectBoundary: FileBoundary,
    otherBoundary: FileBoundary,
  ) => boolean = () => true,
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
        const distance = getBoundaryDistance(
          subjectFile.boundary,
          comparableFile.boundary,
        );

        if (
          distance < minDistance &&
          boundaryFilter(subjectFile.boundary, comparableFile.boundary)
        ) {
          minDistance = distance;
          minDistanceGroup = comparableGroup;
        }
      }
    });
  });

  return [minDistanceGroup, minDistance];
};

const isBoundaryBelow = (
  subjectBoundary: FileBoundary,
  otherBoundary: FileBoundary,
) => {
  return (
    subjectBoundary.top < otherBoundary.top &&
    subjectBoundary.bottom < otherBoundary.bottom
  );
};

const getBoundaryDistance = (
  fromBoundary: FileBoundary,
  toBoundary: FileBoundary,
) => {
  return Math.min(
    Math.abs(fromBoundary.top - toBoundary.bottom),
    Math.abs(fromBoundary.bottom - toBoundary.top),
  );
};

const getGroundDistance = (blockGroup: BlockGroup): number => {
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
