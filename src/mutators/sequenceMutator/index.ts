import { Block, FileFragment } from "../../entities/types";
import { getBurnedTexture } from "../../textures";

type BlockSequence = Block[];

const sequenceMutator = (allSelectionFileFragments: FileFragment[]) => {
  for (const frag of allSelectionFileFragments) {
    const verticalSequences: BlockSequence[] =
      getVerticalSequencesInFileFragment(frag);

    verticalSequences.forEach((sequence) => applyBurnToBlocks(sequence));
  }
};

const getVerticalSequencesInFileFragment = (frag: FileFragment) => {
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

const getIsBlockMatchable = (block: Block): boolean => {
  // block is not matchable if it is burned or an item type
  return getBlockColor(block) !== "burned";
};

// @todo perhaps add this to the texture module
// and have a block color type
const getBlockColor = (block: Block, fallbackColor = "neutral"): string => {
  return block?.sprite?.texture?.label || fallbackColor;
};

const applyBurnToBlocks = (blocks: Block[]) => {
  blocks.forEach((block) => (block.sprite.texture = getBurnedTexture()));
};

export default sequenceMutator;
