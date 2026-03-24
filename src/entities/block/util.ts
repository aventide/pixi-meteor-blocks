import type { Block, BlockGroupId } from "../types";

export const assignBlockGroupId = (blocks: Block[], groupId: BlockGroupId) => {
  blocks.forEach((block) => (block.groupId = groupId));
  return blocks;
};

export const sortBlocksAscending = (blocks: Block[]) =>
  blocks.sort((blockA, blockB) => blockA.sprite.y - blockB.sprite.y);
