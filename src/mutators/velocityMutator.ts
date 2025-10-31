import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { getCeilingDistance, getGroundDistance, getNearestGroup } from "./util";
import { clamp } from "../util";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  // normalize delta calculation based on screen height
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  if (targetDelta === 0) return;

  const [nearestGroup, nearestGroupDistance] = getNearestGroup(blockGroup);

  const groundDistance = getGroundDistance(blockGroup);
  const ceilingDistance = getCeilingDistance(blockGroup);
  const downwardsLimit = Math.min(groundDistance, nearestGroupDistance);
  const upwardsLimit = Math.max(-ceilingDistance, -nearestGroupDistance);
  const resolvedDelta = clamp(targetDelta, upwardsLimit, downwardsLimit);

  // if we were clamped by the other group, average velocities so both adopt the same speed
  const collidedDown =
    targetDelta > 0 &&
    nearestGroupDistance <= groundDistance &&
    targetDelta > nearestGroupDistance;
  const collidedUp = targetDelta < 0 && -targetDelta > nearestGroupDistance;

  if (nearestGroup && (collidedDown || collidedUp)) {
    const newV = (blockGroup.velocity + nearestGroup.velocity) / 2;
    blockGroup.velocity = newV;
    nearestGroup.velocity = newV;
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
