import type { BlockGroup } from "../entities/types";

export const getLeadingBlockInGroup = (blockGroup: BlockGroup) => {
  // this assumes the blockGroup has at least one block
  let leadingBlock = blockGroup.blocks[0];

  const fallingFn = (a: number, b: number) => a > b;
  const risingFn = (a: number, b: number) => a < b;
  const compareFn = blockGroup.velocity >= 0 ? fallingFn : risingFn;

  blockGroup.blocks.forEach((block) => {
    if (compareFn(block.sprite.y, leadingBlock.sprite.y)) {
      leadingBlock = block;
    }
  });

  return leadingBlock;
};
