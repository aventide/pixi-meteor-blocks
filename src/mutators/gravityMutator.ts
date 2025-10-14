import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";

export const gravityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { gravity } = getWorld();
  blockGroup.velocity += gravity * dt;
};
