import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";

export const descentMutator = (blockGroup: BlockGroup, dt: number) => {
  const { gravity } = getWorld();

  // if blockGroup is a launch group (or within one), then set velocity to a constant descent rate
  // otherwise, apply acceleration due to gravity
  blockGroup.velocity += gravity * dt;
};
