import {
  Block,
  BlockGroup,
  BlockGroupId,
  BlockSequence,
  FileFragment,
  mergeBlockGroups,
} from "../../entities";
import { getBurnedTexture } from "../../textures";
import { getBlockSize } from "../../world";
import { isClose } from "../../util";
import { DEFAULT_FILE_COUNT } from "../../constants";

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

export const getHorizontalSequencesInSelectionFragments = (
  frags: FileFragment[],
) => {
  const sequences: BlockSequence[] = [];
  const blocksByRow = new Map<number, Block[]>();
  const blockSize = getBlockSize();

  for (const frag of frags) {
    for (const block of frag.blocks) {
      const rowKey = Math.round(block.sprite.y);
      const existingRowBlocks = blocksByRow.get(rowKey);

      if (existingRowBlocks) {
        existingRowBlocks.push(block);
      } else {
        blocksByRow.set(rowKey, [block]);
      }
    }
  }

  for (const rowBlocks of blocksByRow.values()) {
    const blocksByFileNumber = new Map<number, Block>();

    rowBlocks.forEach((block) => {
      blocksByFileNumber.set(block.file, block);
    });

    let matchBuffer: BlockSequence = [];

    for (let fileNumber = 1; fileNumber <= DEFAULT_FILE_COUNT; fileNumber++) {
      const currentBlock = blocksByFileNumber.get(fileNumber);

      if (!currentBlock || !getIsBlockMatchable(currentBlock)) {
        if (matchBuffer.length >= 3) sequences.push(matchBuffer);
        matchBuffer = [];
        continue;
      }

      const previousBlock = matchBuffer[matchBuffer.length - 1];

      if (!previousBlock) {
        matchBuffer = [currentBlock];
        continue;
      }

      const currentBlockColor = getBlockColor(currentBlock);
      const previousBlockColor = getBlockColor(previousBlock);
      const isAdjacentToPreviousBlock = isClose(
        currentBlock.sprite.x - previousBlock.sprite.x,
        blockSize,
      );
      const isExactlyAlignedWithPreviousBlock = isClose(
        currentBlock.sprite.y,
        previousBlock.sprite.y,
      );

      if (
        currentBlockColor === previousBlockColor &&
        isAdjacentToPreviousBlock &&
        isExactlyAlignedWithPreviousBlock
      ) {
        matchBuffer.push(currentBlock);
      } else {
        if (matchBuffer.length >= 3) sequences.push(matchBuffer);
        matchBuffer = [currentBlock];
      }
    }

    if (matchBuffer.length >= 3) sequences.push(matchBuffer);
  }

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
