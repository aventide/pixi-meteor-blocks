import type { BlockGroup } from "../entities/types";

import { getBlockSize, getWorld } from "../world";
import { DEFAULT_REFERENCE_HEIGHT } from "../constants";
import { getLeadingBlockInGroup } from "./util";

export const velocityMutator = (blockGroup: BlockGroup, dt: number) => {
  const { height: worldHeight } = getWorld();
  const blockSize = getBlockSize();

  const groundY = worldHeight - blockSize;

  const leadingBlock = getLeadingBlockInGroup(blockGroup);
  const targetDelta =
    blockGroup.velocity * dt * (worldHeight / DEFAULT_REFERENCE_HEIGHT);

  const targetLeadingYCoord = leadingBlock.sprite.y + targetDelta;

  let adjustedDelta = targetDelta;

  if (targetLeadingYCoord > groundY) {
    adjustedDelta = targetDelta - (targetLeadingYCoord - groundY);
    blockGroup.velocity = 0;
  }

  // do final calculated movement on group
  blockGroup.files.forEach((file) => {
    file.boundary.top += adjustedDelta;
    file.boundary.bottom += adjustedDelta;
  });
  blockGroup.blocks.forEach((block) => {
    block.sprite.y += adjustedDelta;
  });
};
