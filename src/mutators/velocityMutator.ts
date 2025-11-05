import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import {
  getDistanceToCeiling,
  getDistanceToGround,
  getNearestGroup,
} from "../entities/util";
import { clamp } from "../util";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  // normalize delta calculation based on screen height
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  if (targetDelta === 0) return;

  // @todo emphasize that this means "nearest in this current direction"
  const [nearestGroup, distanceToNearestGroup] = getNearestGroup(blockGroup);
  const distanceToGround = getDistanceToGround(blockGroup);
  const distanceToCeiling = getDistanceToCeiling(blockGroup);
  const downwardsLimit = Math.min(distanceToGround, distanceToNearestGroup);
  const upwardsLimit = Math.max(-distanceToCeiling, -distanceToNearestGroup);

  const resolvedDelta = clamp(targetDelta, upwardsLimit, downwardsLimit);

  const collidedWithNearestGroup =
    nearestGroup && resolvedDelta === distanceToNearestGroup;
  const collidedWithCeiling = resolvedDelta === distanceToCeiling;

  if (collidedWithNearestGroup) {
    const averagedVelocity = (blockGroup.velocity + nearestGroup.velocity) / 2;
    blockGroup.velocity = averagedVelocity;
    nearestGroup.velocity = averagedVelocity;
  }

  if (collidedWithCeiling) {
    blockGroup.velocity = 0;
  }

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += resolvedDelta;
    file.boundary.bottom += resolvedDelta;

    file.overlay.y += resolvedDelta;
  });
  blockGroup.files.forEach((file) =>
    file.blocks.forEach((block) => {
      block.sprite.y += resolvedDelta;
    }),
  );
};
