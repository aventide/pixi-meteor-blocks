import type { BlockGroup } from "../entities/types";

import { getWorld } from "../world";

export const gravityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { gravity, height } = getWorld();

  blockGroup.blocks.forEach((block) => {
    block.velocity += gravity * dt;

    // these calculations also need to be normalized for block size/dimensions, to account for differences in canvas size
    // otherwise taller screens will take longer to drop blocks
    block.sprite.y += block.velocity * dt;

    const groundY = height - block.sprite.height;

    if (block.sprite.y >= groundY) {
      block.sprite.y = groundY;
      block.velocity = 0;
    }
  });
};
