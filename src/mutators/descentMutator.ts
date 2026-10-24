import type { BlockGroup } from "../entities/types";

import { getActivePlanet, getWorld } from "../world";

export const descentMutator = (blockGroup: BlockGroup, dt: number) => {
  const { gravity } = getWorld();

  blockGroup.velocity += gravity * dt;

  // if blockGroup is a launch group (or within one), then cap downward velocity to a max speed
  if (blockGroup.type === "launch" && blockGroup.velocity > 0) {
    blockGroup.velocity = Math.min(
      blockGroup.velocity,
      getActivePlanet().physics.launchDescentRate,
    );
  }
};
