import type { Block } from "../entities/types";

import { getWorld } from "../world";

export const gravityMutator = (block: Block, dt: number) => {
  const { gravity, height } = getWorld();

  block.velocity += gravity * dt;

  // these calculations also need to be normalized for block size/dimensions, to account for differences in canvas size
  // otherwise taller screens will take longer to drop blocks
  block.sprite.y += block.velocity * dt;

  const groundY = height - (block.fileOrder + 1) * block.sprite.height;

  if (block.sprite.y >= groundY) {
    block.sprite.y = groundY;
    block.velocity = 0;
  }
};
