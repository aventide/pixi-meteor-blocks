import { DEFAULT_LAUNCH_DESCENT_RATE } from "../constants";
import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";

export const descentMutator = (blockGroup: BlockGroup, dt: number) => {
  const { gravity } = getWorld();

  blockGroup.velocity += gravity * dt;

  // if blockGroup is a launch group (or within one), then cap downward velocity to a max speed
  // if (blockGroup.type === "launch" && blockGroup.velocity > 0) {
  //   blockGroup.velocity = Math.min(
  //     blockGroup.velocity,
  //     DEFAULT_LAUNCH_DESCENT_RATE,
  //   );
  // }
};
