import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { getGroundDistance, getNearestGroup } from "./util";
import { clamp } from "../util";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();

  // normalize delta calculation based on screen height
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  if (targetDelta === 0) return;

  const [, nearestGroupDistance] = getNearestGroup(blockGroup);

  const downwardsLimit = Math.min(
    getGroundDistance(blockGroup),
    nearestGroupDistance,
  );
  const upwardsLimit = -nearestGroupDistance;
  const resolvedDelta = clamp(targetDelta, upwardsLimit, downwardsLimit);

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += resolvedDelta;
    file.boundary.bottom += resolvedDelta;
  });
  blockGroup.blocks.forEach((block) => {
    block.sprite.y += resolvedDelta;
  });
};
