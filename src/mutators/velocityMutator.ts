import type { BlockGroup } from "../entities/types";

import { getBlockSize, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  getDirectionallyNearestGroup,
  getDistanceToCeiling,
  getDistanceToGround,
} from "../entities/util";
import { clamp } from "../util";
import { combineBlockGroups } from "../entities";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight, globalPointer } = getWorld();
  const blockSize = getBlockSize();

  // normalize delta calculation based on screen height
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  if (targetDelta === 0) return;

  const [nearestGroup, distanceToNearestGroup] =
    getDirectionallyNearestGroup(blockGroup);
  const distanceToGround = getDistanceToGround(blockGroup);
  const distanceToCeiling = getDistanceToCeiling(blockGroup);
  const downwardsLimit = Math.min(distanceToGround, distanceToNearestGroup);
  const upwardsLimit = Math.max(-distanceToCeiling, -distanceToNearestGroup);

  const resolvedDelta = clamp(targetDelta, upwardsLimit, downwardsLimit);

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += resolvedDelta;
    file.boundary.bottom += resolvedDelta;

    file.overlay.y += resolvedDelta;

    if (
      globalPointer.x >= (file.number - 1) * blockSize &&
      globalPointer.x <= (file.number - 1) * blockSize + blockSize &&
      globalPointer.y >= file.boundary.top &&
      globalPointer.y <= file.boundary.bottom
    ) {
      file.overlay.visible = true;
    } else {
      file.overlay.visible = false;
    }
  });
  blockGroup.files.forEach((file) =>
    file.blocks.forEach((block) => {
      block.sprite.y += resolvedDelta;
    }),
  );

  const collidedWithNearestGroup =
    nearestGroup &&
    (resolvedDelta > 0
      ? resolvedDelta === distanceToNearestGroup
      : resolvedDelta === -distanceToNearestGroup);
  const collidedWithCeiling = resolvedDelta === distanceToCeiling;

  if (collidedWithNearestGroup) {
    combineBlockGroups(blockGroup, nearestGroup);
  }

  if (collidedWithCeiling) {
    blockGroup.velocity = 0;
  }
};
