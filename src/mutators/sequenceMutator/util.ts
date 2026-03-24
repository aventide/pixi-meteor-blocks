import {
  Block,
  BlockGroup,
  BlockGroupId,
  BlockSequence,
  FileFragment,
  mergeBlockGroups,
} from "../../entities";
import { getBurnedTexture } from "../../textures";

export const getVerticalSequencesInFileFragment = (frag: FileFragment) => {
  const sequences: BlockSequence[] = [];
  let matchBuffer: BlockSequence = [];

  for (const currentBlock of frag.blocks) {
    if (!getIsBlockMatchable(currentBlock)) {
      if (matchBuffer.length >= 3) sequences.push(matchBuffer);
      matchBuffer = [];
      continue;
    }

    const currentBlockColor = getBlockColor(currentBlock);
    const previousBlockColor = getBlockColor(
      matchBuffer[matchBuffer.length - 1],
    );

    if (matchBuffer.length === 0 || currentBlockColor === previousBlockColor) {
      matchBuffer.push(currentBlock);
    } else {
      if (matchBuffer.length >= 3) sequences.push(matchBuffer);
      matchBuffer = [currentBlock];
    }
  }

  if (matchBuffer.length >= 3) sequences.push(matchBuffer);

  return sequences;
};

export const getIsBlockMatchable = (block: Block): boolean => {
  // block is not matchable if it is burned or an item type
  return !getBlockColor(block).includes("burned");
};

// @todo perhaps add this to the texture module
// and have a block color type
export const getBlockColor = (
  block: Block,
  fallbackColor = "neutral",
): string => {
  return block?.sprite?.texture?.label || fallbackColor;
};

export const applyBurnToBlocks = (blocks: Block[]) => {
  blocks.forEach((block) => (block.sprite.texture = getBurnedTexture()));
};

export const mergeAllBlockGroups = (
  blockGroups: BlockGroup[],
): BlockGroup | null => {
  if (blockGroups.length === 0) {
    return null;
  }

  let mergedGroup = blockGroups[0];

  for (let i = 1; i < blockGroups.length; i++) {
    mergedGroup = mergeBlockGroups(mergedGroup, blockGroups[i]);
  }

  return mergedGroup;
};

export const getBlocksAboveInFileFragment = (
  block: Block,
  fileFragment: FileFragment,
): Block[] => {
  const blockIndex = fileFragment.blocks.findIndex(
    (fragmentBlock) => fragmentBlock.sprite.uid === block.sprite.uid,
  );

  if (blockIndex === -1) {
    return [];
  }

  return fileFragment.blocks.slice(0, blockIndex + 1);
};

export const getBlocksByGroupId = (
  blocks: Block[],
): Map<BlockGroupId, Block[]> => {
  const blocksByGroupId = new Map<BlockGroupId, Block[]>();

  blocks.forEach((block) => {
    if (block.groupId === null) return;

    const existingBlocks = blocksByGroupId.get(block.groupId);
    if (existingBlocks) {
      existingBlocks.push(block);
    } else {
      blocksByGroupId.set(block.groupId, [block]);
    }
  });

  return blocksByGroupId;
};
